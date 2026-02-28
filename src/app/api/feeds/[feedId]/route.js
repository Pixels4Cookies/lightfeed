import { NextResponse } from "next/server";
import { normalizeRequestFeeds } from "@/lib/feed-request";
import {
  deletePage,
  getPageById,
  listPageFeedMix,
  updatePage,
} from "@/lib/lightfeed-data";
import { getPageFeedStream } from "@/lib/rss-stream";

const MAX_FEEDS_PER_REQUEST = 20;

export const dynamic = "force-dynamic";

function resolveFeedIdFromParams(params) {
  return String(params?.feedId ?? params?.pageId ?? "").trim();
}

export async function GET(_request, { params }) {
  const feedId = resolveFeedIdFromParams(await params);
  const page = getPageById(feedId);

  if (!page) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  const stream = await getPageFeedStream(feedId, { limit: 24 });

  return NextResponse.json({
    data: {
      ...page,
      feedMix: listPageFeedMix(feedId),
      items: stream.items,
      feedErrors: stream.feedErrors,
      fetchedAt: stream.fetchedAt,
    },
    meta: {
      source: "rss",
      note: "Live RSS results are sorted by publish date (newest first).",
    },
  });
}

export async function PATCH(request, { params }) {
  const feedId = resolveFeedIdFromParams(await params);

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(payload ?? {}, "name")) {
      const feedName = String(payload?.name ?? "").trim();
      if (!feedName) {
        return NextResponse.json({ error: "Feed name is required." }, { status: 400 });
      }
      updates.name = feedName;
    }

    if (Object.prototype.hasOwnProperty.call(payload ?? {}, "isHomepage")) {
      updates.isHomepage = payload?.isHomepage === true;
    }

    if (Object.prototype.hasOwnProperty.call(payload ?? {}, "feeds")) {
      const normalizedFeeds = normalizeRequestFeeds(payload?.feeds, MAX_FEEDS_PER_REQUEST);
      updates.feeds = normalizedFeeds;
    }

    const updatedPage = updatePage(feedId, updates);

    return NextResponse.json({
      data: updatedPage,
      meta: {
        source: "sqlite",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update feed.";
    const statusCode = message === "Feed not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(_request, { params }) {
  const feedId = resolveFeedIdFromParams(await params);

  try {
    const removed = deletePage(feedId);

    if (!removed) {
      return NextResponse.json({ error: "Feed not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete feed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
