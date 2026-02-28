const DEFAULT_MAX_FEEDS = 20;

function normalizeRequestFeed(feed, index) {
  const url = String(feed?.url ?? "").trim();
  if (!url) {
    throw new Error(`Feed ${index + 1} is missing an RSS URL.`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Feed ${index + 1} must be a valid URL.`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`Feed ${index + 1} must use http or https.`);
  }

  return {
    url: parsedUrl.toString(),
  };
}

export function normalizeRequestFeeds(rawFeeds, maxFeeds = DEFAULT_MAX_FEEDS) {
  const feeds = Array.isArray(rawFeeds) ? rawFeeds : [];

  if (feeds.length === 0) {
    throw new Error("Provide at least one RSS feed.");
  }

  if (feeds.length > maxFeeds) {
    throw new Error(`A maximum of ${maxFeeds} feeds is allowed.`);
  }

  return feeds.map((feed, index) => normalizeRequestFeed(feed, index));
}
