import { NextResponse } from "next/server";
import {
  listSavedArticles,
  removeSavedArticleByLink,
  saveArticleForLater,
} from "@/lib/saved-articles-db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    data: listSavedArticles(),
    meta: {
      source: "sqlite",
      note: "Saved articles are persisted locally for this instance.",
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
    const savedArticle = saveArticleForLater(payload);

    return NextResponse.json({ data: savedArticle }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save article.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const articleLink = String(payload?.link ?? "").trim();

    if (!articleLink) {
      return NextResponse.json({ error: "Article link is required." }, { status: 400 });
    }

    const removed = removeSavedArticleByLink(articleLink);
    if (!removed) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove article." }, { status: 500 });
  }
}
