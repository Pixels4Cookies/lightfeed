import { NextResponse } from "next/server";
import { normalizeRequestFeeds } from "@/lib/feed-request";
import { createPage, listPages, reorderPages } from "@/lib/lightfeed-data";

const MAX_FEEDS_PER_REQUEST = 20;

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    data: listPages(),
    meta: {
      source: "sqlite",
      note: "Feeds are persisted locally in SQLite storage.",
    },
  });
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const feedName = String(payload?.name ?? "").trim();

    if (!feedName) {
      return NextResponse.json({ error: "Feed name is required." }, { status: 400 });
    }

    const normalizedFeeds = normalizeRequestFeeds(payload?.feeds, MAX_FEEDS_PER_REQUEST);

    const createdPage = createPage({
      name: feedName,
      isHomepage: payload?.isHomepage === true,
      feeds: normalizedFeeds,
    });

    return NextResponse.json(
      {
        data: createdPage,
        meta: {
          source: "sqlite",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create feed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const reorderedPages = reorderPages(payload?.pageIds);

    return NextResponse.json({
      data: reorderedPages,
      meta: {
        source: "sqlite",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder feeds.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
