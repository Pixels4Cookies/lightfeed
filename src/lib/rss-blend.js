import { inferFeedTitleFromUrl } from "@/lib/feed-utils";

export const DEFAULT_BLEND_SIZE = 24;

function normalizeMixEntry(feedConfig, index) {
  const feedId = String(feedConfig.feedId ?? `custom-${index + 1}`);
  const url = String(feedConfig.url ?? "").trim();

  return {
    ...feedConfig,
    feedId,
    url,
    title: String(feedConfig.title ?? "").trim() || inferFeedTitleFromUrl(url),
  };
}

function makeItemKey(item) {
  return `${item.link}|${item.title}|${item.publishedAt ?? ""}`;
}

export function normalizeFeedMix(mix) {
  return (mix ?? [])
    .map((feedConfig, index) => normalizeMixEntry(feedConfig, index))
    .filter((feedConfig) => feedConfig.url);
}

export function blendItemsByRecency(feedResults, targetCount) {
  const allItems = feedResults.flatMap((result) =>
    result.items.map((item) => ({
      ...item,
      sourceFeedId: result.feedId,
      sourceTitle: result.feedTitle,
      sourceUrl: result.feedUrl,
      sourceImage: result.feedImage,
    })),
  );

  if (allItems.length === 0) return [];

  allItems.sort((first, second) => second.publishedAtMs - first.publishedAtMs);

  const deduped = [];
  const seen = new Set();

  for (const item of allItems) {
    if (deduped.length >= targetCount) break;

    const itemKey = makeItemKey(item);
    if (seen.has(itemKey)) continue;

    seen.add(itemKey);
    deduped.push(item);
  }

  return deduped;
}
