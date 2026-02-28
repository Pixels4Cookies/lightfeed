import { NextResponse } from "next/server";
import { normalizeRequestFeeds } from "@/lib/feed-request";
import { inferFeedTitleFromUrl } from "@/lib/feed-utils";
import { getFeedStreamFromMix } from "@/lib/rss-stream";

const MAX_FEEDS_PER_REQUEST = 20;

export async function POST(request) {
  try {
    const payload = await request.json();
    const normalized = normalizeRequestFeeds(payload?.feeds, MAX_FEEDS_PER_REQUEST);
    const feedMix = normalized.map((feed, index) => ({
      feedId: `custom-${index + 1}`,
      title: inferFeedTitleFromUrl(feed.url),
      url: feed.url,
    }));

    const stream = await getFeedStreamFromMix(feedMix, { limit: 28 });

    return NextResponse.json({
      data: {
        feedMix,
        items: stream.items,
        feedErrors: stream.feedErrors,
        fetchedAt: stream.fetchedAt,
      },
      meta: {
        source: "rss-preview",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview feed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
