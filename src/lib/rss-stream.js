import { listPageFeedMix } from "@/lib/lightfeed-data";
import {
  blendItemsByRecency,
  DEFAULT_BLEND_SIZE,
  normalizeFeedMix,
} from "@/lib/rss-blend";
import { parseFeedXml } from "@/lib/rss-parse";

const FEED_TIMEOUT_MS = 9000;

async function fetchFeed(feedConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "LightFeed/0.1 (+self-hosted)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        feedId: feedConfig.feedId,
        feedTitle: feedConfig.title,
        feedUrl: feedConfig.url,
        items: [],
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const xml = await response.text();
    const parsed = parseFeedXml(xml, feedConfig);

    return {
      feedId: feedConfig.feedId,
      feedTitle: parsed.feedTitle || feedConfig.title,
      feedImage: parsed.feedImage,
      feedUrl: feedConfig.url,
      items: parsed.items,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown feed fetch error";

    return {
      feedId: feedConfig.feedId,
      feedTitle: feedConfig.title,
      feedUrl: feedConfig.url,
      items: [],
      error: errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getFeedStreamFromMix(mix, options = {}) {
  const normalizedMix = normalizeFeedMix(mix);
  const targetCount = Number(options.limit) > 0 ? Number(options.limit) : DEFAULT_BLEND_SIZE;

  if (normalizedMix.length === 0) {
    return {
      items: [],
      feedErrors: [],
      fetchedAt: new Date().toISOString(),
    };
  }

  const feedResults = await Promise.all(
    normalizedMix.map((feedConfig) => fetchFeed(feedConfig)),
  );
  const items = blendItemsByRecency(feedResults, targetCount);

  const feedErrors = feedResults
    .filter((result) => result.error)
    .map((result) => ({
      feedId: result.feedId,
      feedTitle: result.feedTitle,
      feedUrl: result.feedUrl,
      message: result.error,
    }));

  return {
    items,
    feedErrors,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getPageFeedStream(pageId, options = {}) {
  return getFeedStreamFromMix(listPageFeedMix(pageId), options);
}
