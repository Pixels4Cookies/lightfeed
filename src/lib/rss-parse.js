const MAX_ITEMS_PER_FEED = 30;

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const ABSOLUTE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function removeCdata(value) {
  return (value ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeXmlEntities(value) {
  const text = removeCdata(value ?? "");

  return text.replace(
    /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (entity, body) => {
      const token = String(body).toLowerCase();
      if (token === "amp") return "&";
      if (token === "lt") return "<";
      if (token === "gt") return ">";
      if (token === "quot") return "\"";
      if (token === "apos") return "'";

      if (token.startsWith("#x")) {
        const codePoint = Number.parseInt(token.slice(2), 16);
        return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
      }

      if (token.startsWith("#")) {
        const codePoint = Number.parseInt(token.slice(1), 10);
        return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
      }

      return entity;
    },
  );
}

function toPlainText(value) {
  return decodeXmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maxLength = 220) {
  const cleanValue = (value ?? "").trim();
  if (cleanValue.length <= maxLength) return cleanValue;
  return `${cleanValue.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveUrl(rawUrl, baseUrl, fallback = baseUrl) {
  if (!rawUrl) return fallback;

  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return fallback;
  }
}

function resolveArticleUrl(rawUrl, baseUrl) {
  return resolveUrl(rawUrl, baseUrl, null);
}

function parsePublishedAt(rawValue) {
  const parsedValue = Date.parse(rawValue ?? "");

  if (Number.isNaN(parsedValue)) {
    return { publishedAt: null, publishedAtMs: 0 };
  }

  return {
    publishedAt: new Date(parsedValue).toISOString(),
    publishedAtMs: parsedValue,
  };
}

function formatPublishedLabel(publishedAtMs) {
  if (!publishedAtMs) return "Unknown publish time";

  const deltaSeconds = Math.round((publishedAtMs - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(deltaSeconds);

  if (absoluteSeconds > 60 * 60 * 24 * 14) {
    return ABSOLUTE_TIME_FORMATTER.format(new Date(publishedAtMs));
  }
  if (absoluteSeconds < 60) {
    return RELATIVE_TIME_FORMATTER.format(deltaSeconds, "second");
  }
  if (absoluteSeconds < 60 * 60) {
    return RELATIVE_TIME_FORMATTER.format(Math.round(deltaSeconds / 60), "minute");
  }
  if (absoluteSeconds < 60 * 60 * 24) {
    return RELATIVE_TIME_FORMATTER.format(Math.round(deltaSeconds / 3600), "hour");
  }

  return RELATIVE_TIME_FORMATTER.format(
    Math.round(deltaSeconds / (60 * 60 * 24)),
    "day",
  );
}

function firstMatchValue(input, patterns) {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function firstDecodedMatchValue(input, patterns) {
  return decodeXmlEntities(firstMatchValue(input, patterns));
}

function extractImageFromHtml(rawValue, baseUrl) {
  const imageSrc = firstDecodedMatchValue(rawValue ?? "", [
    /<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/i,
  ]);

  return resolveUrl(imageSrc, baseUrl);
}

function extractRssItemImageUrl(itemBlock, feedUrl, htmlCandidates) {
  const tagImageUrl = firstDecodedMatchValue(itemBlock, [
    /<media:content\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<media:thumbnail\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*\btype=["']image\/[^"']*["'][^>]*>/i,
    /<enclosure\b[^>]*\btype=["']image\/[^"']*["'][^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<itunes:image\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i,
  ]);

  if (tagImageUrl) {
    return resolveUrl(tagImageUrl, feedUrl);
  }

  for (const candidate of htmlCandidates) {
    const imageFromHtml = extractImageFromHtml(candidate, feedUrl);
    if (imageFromHtml !== feedUrl) {
      return imageFromHtml;
    }
  }

  return null;
}

function extractAtomItemImageUrl(entryBlock, feedUrl, htmlCandidates) {
  const tagImageUrl = firstDecodedMatchValue(entryBlock, [
    /<media:content\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<media:thumbnail\b[^>]*\burl=["']([^"']+)["'][^>]*>/i,
    /<link\b[^>]*\brel=["']enclosure["'][^>]*\bhref=["']([^"']+)["'][^>]*\btype=["']image\/[^"']*["'][^>]*\/?>/i,
    /<link\b[^>]*\btype=["']image\/[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']enclosure["'][^>]*\/?>/i,
  ]);

  if (tagImageUrl) {
    return resolveUrl(tagImageUrl, feedUrl);
  }

  for (const candidate of htmlCandidates) {
    const imageFromHtml = extractImageFromHtml(candidate, feedUrl);
    if (imageFromHtml !== feedUrl) {
      return imageFromHtml;
    }
  }

  return null;
}

function extractRssFeedImage(xml, feedUrl) {
  const channelMatch = xml.match(/<channel\b[\s\S]*?<\/channel>/i);
  if (!channelMatch) return null;

  const channel = channelMatch[0];

  // Try <image> tag (standard RSS)
  const imageMatch = channel.match(/<image\b[\s\S]*?<\/image>/i);
  if (imageMatch) {
    const urlMatch = imageMatch[0].match(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/i);
    if (urlMatch?.[1]) {
      return resolveUrl(toPlainText(urlMatch[1]), feedUrl);
    }
  }

  // Try <itunes:image> or <googleplay:image>
  const itunesImage = firstMatchValue(channel, [
    /<itunes:image\s+[^>]*href=["']([^"']+)["'][^>]*>/i,
    /<googleplay:image\s+[^>]*href=["']([^"']+)["'][^>]*>/i,
  ]);
  if (itunesImage) {
    return resolveUrl(itunesImage, feedUrl);
  }

  // Try <media:thumbnail> on channel
  const mediaThumbnail = firstMatchValue(channel, [
    /<media:thumbnail\s+[^>]*url=["']([^"']+)["'][^>]*>/i,
  ]);
  if (mediaThumbnail) {
    return resolveUrl(mediaThumbnail, feedUrl);
  }

  // Try <logo> tag
  const logoMatch = channel.match(/<logo(?:\s[^>]*)?>([\s\S]*?)<\/logo>/i);
  if (logoMatch?.[1]) {
    return resolveUrl(toPlainText(logoMatch[1]), feedUrl);
  }

  return null;
}

function extractAtomFeedImage(xml, feedUrl) {
  const feedMatch = xml.match(/<feed\b[\s\S]*?<\/feed>/i);
  if (!feedMatch) return null;

  const feed = feedMatch[0];

  // Try <icon> tag (Atom standard - usually small icon)
  const iconMatch = feed.match(/<icon(?:\s[^>]*)?>([\s\S]*?)<\/icon>/i);
  if (iconMatch?.[1]) {
    const iconUrl = toPlainText(iconMatch[1]);
    if (iconUrl) {
      return resolveUrl(iconUrl, feedUrl);
    }
  }

  // Try <logo> tag (Atom standard - usually larger logo)
  const logoMatch = feed.match(/<logo(?:\s[^>]*)?>([\s\S]*?)<\/logo>/i);
  if (logoMatch?.[1]) {
    const logoUrl = toPlainText(logoMatch[1]);
    if (logoUrl) {
      return resolveUrl(logoUrl, feedUrl);
    }
  }

  return null;
}

function extractRssFeedTitle(xml) {
  const channelMatch = xml.match(/<channel\b[\s\S]*?<\/channel>/i);
  if (!channelMatch) return "";

  return toPlainText(
    firstMatchValue(channelMatch[0], [/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i]),
  );
}

function parseRssItem(itemBlock, feedConfig, index) {
  const title = toPlainText(
    firstMatchValue(itemBlock, [/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i]),
  );

  const descriptionRaw = firstMatchValue(itemBlock, [
    /<description(?:\s[^>]*)?>([\s\S]*?)<\/description>/i,
  ]);
  const contentRaw = firstMatchValue(itemBlock, [
    /<content:encoded(?:\s[^>]*)?>([\s\S]*?)<\/content:encoded>/i,
    /<content(?:\s[^>]*)?>([\s\S]*?)<\/content>/i,
  ]);

  const link = resolveArticleUrl(
    toPlainText(
      firstMatchValue(itemBlock, [
        /<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i,
        /<guid(?:\s[^>]*)?>([\s\S]*?)<\/guid>/i,
      ]),
    ),
    feedConfig.url,
  );

  const summary = truncate(toPlainText(descriptionRaw || contentRaw));

  const imageUrl = extractRssItemImageUrl(itemBlock, feedConfig.url, [
    contentRaw,
    descriptionRaw,
  ]);

  const { publishedAt, publishedAtMs } = parsePublishedAt(
    toPlainText(
      firstMatchValue(itemBlock, [
        /<pubDate(?:\s[^>]*)?>([\s\S]*?)<\/pubDate>/i,
        /<dc:date(?:\s[^>]*)?>([\s\S]*?)<\/dc:date>/i,
        /<published(?:\s[^>]*)?>([\s\S]*?)<\/published>/i,
        /<updated(?:\s[^>]*)?>([\s\S]*?)<\/updated>/i,
      ]),
    ),
  );

  const idSeed = toPlainText(
    firstMatchValue(itemBlock, [
      /<guid(?:\s[^>]*)?>([\s\S]*?)<\/guid>/i,
      /<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i,
      /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i,
    ]),
  );

  return {
    id: `${feedConfig.feedId}-${idSeed || index}`,
    title: title || "Untitled article",
    link,
    summary,
    imageUrl,
    publishedAt,
    publishedAtMs,
    publishedLabel: formatPublishedLabel(publishedAtMs),
  };
}

function extractAtomFeedTitle(xml) {
  const feedMatch = xml.match(/<feed\b[\s\S]*?<\/feed>/i);
  if (!feedMatch) return "";

  return toPlainText(
    firstMatchValue(feedMatch[0], [/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i]),
  );
}

function extractAtomLink(entryBlock, fallbackUrl) {
  const alternateLinkTag =
    entryBlock.match(/<link\b[^>]*rel=["']alternate["'][^>]*>/i) ??
    entryBlock.match(/<link\b[^>]*\/?>/i);

  if (alternateLinkTag?.[0]) {
    const hrefMatch = alternateLinkTag[0].match(/\bhref=["']([^"']+)["']/i);
    if (hrefMatch?.[1]) {
      return resolveArticleUrl(decodeXmlEntities(hrefMatch[1]), fallbackUrl);
    }
  }

  const entryId = toPlainText(
    firstMatchValue(entryBlock, [/<id(?:\s[^>]*)?>([\s\S]*?)<\/id>/i]),
  );

  return resolveArticleUrl(entryId, fallbackUrl);
}

function parseAtomEntry(entryBlock, feedConfig, index) {
  const title = toPlainText(
    firstMatchValue(entryBlock, [/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i]),
  );

  const summaryRaw = firstMatchValue(entryBlock, [
    /<summary(?:\s[^>]*)?>([\s\S]*?)<\/summary>/i,
  ]);
  const contentRaw = firstMatchValue(entryBlock, [
    /<content(?:\s[^>]*)?>([\s\S]*?)<\/content>/i,
  ]);

  const link = extractAtomLink(entryBlock, feedConfig.url);
  const summary = truncate(toPlainText(summaryRaw || contentRaw));

  const imageUrl = extractAtomItemImageUrl(entryBlock, feedConfig.url, [
    contentRaw,
    summaryRaw,
  ]);

  const { publishedAt, publishedAtMs } = parsePublishedAt(
    toPlainText(
      firstMatchValue(entryBlock, [
        /<updated(?:\s[^>]*)?>([\s\S]*?)<\/updated>/i,
        /<published(?:\s[^>]*)?>([\s\S]*?)<\/published>/i,
      ]),
    ),
  );

  const idSeed = toPlainText(
    firstMatchValue(entryBlock, [
      /<id(?:\s[^>]*)?>([\s\S]*?)<\/id>/i,
      /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i,
    ]),
  );

  return {
    id: `${feedConfig.feedId}-${idSeed || index}`,
    title: title || "Untitled article",
    link,
    summary,
    imageUrl,
    publishedAt,
    publishedAtMs,
    publishedLabel: formatPublishedLabel(publishedAtMs),
  };
}

export function parseFeedXml(xml, feedConfig) {
  const rssBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  if (rssBlocks.length > 0) {
    const items = rssBlocks
      .slice(0, MAX_ITEMS_PER_FEED)
      .map((block, index) => parseRssItem(block, feedConfig, index))
      .filter((item) => item.title && item.link)
      .sort((first, second) => second.publishedAtMs - first.publishedAtMs);

    return {
      feedTitle: extractRssFeedTitle(xml) || feedConfig.title,
      feedImage: extractRssFeedImage(xml, feedConfig.url),
      items,
    };
  }

  const atomBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const items = atomBlocks
    .slice(0, MAX_ITEMS_PER_FEED)
    .map((block, index) => parseAtomEntry(block, feedConfig, index))
    .filter((item) => item.title && item.link)
    .sort((first, second) => second.publishedAtMs - first.publishedAtMs);

  return {
    feedTitle: extractAtomFeedTitle(xml) || feedConfig.title,
    feedImage: extractAtomFeedImage(xml, feedConfig.url),
    items,
  };
}
