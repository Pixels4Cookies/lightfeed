import "server-only";
import { createHash } from "node:crypto";
import { getSqliteDatabase } from "@/lib/sqlite";

let initialized = false;

function getDatabase() {
  const database = getSqliteDatabase();

  if (!initialized) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS saved_articles (
      id TEXT PRIMARY KEY,
      article_id TEXT,
      title TEXT NOT NULL,
      link TEXT NOT NULL UNIQUE,
      summary TEXT,
      image_url TEXT,
      source_feed_id TEXT,
      source_title TEXT,
      source_url TEXT,
      published_at TEXT,
      published_label TEXT,
      page_id TEXT,
      page_name TEXT,
      saved_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_saved_articles_saved_at
      ON saved_articles(saved_at DESC);
  `);
    initialized = true;
  }

  return database;
}

function ensureNonEmptyText(value, fieldName) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function toNullableText(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function makeSavedArticleId(link) {
  return createHash("sha256").update(link).digest("hex").slice(0, 24);
}

function mapRowToSavedArticle(row) {
  return {
    id: row.id,
    articleId: row.article_id,
    title: row.title,
    link: row.link,
    summary: row.summary,
    imageUrl: row.image_url,
    sourceFeedId: row.source_feed_id,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    publishedLabel: row.published_label,
    pageId: row.page_id,
    pageName: row.page_name,
    savedAt: row.saved_at,
  };
}

export function listSavedArticles(options = {}) {
  const limit = Number.isFinite(options.limit) ? Number(options.limit) : 500;
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        id,
        article_id,
        title,
        link,
        summary,
        image_url,
        source_feed_id,
        source_title,
        source_url,
        published_at,
        published_label,
        page_id,
        page_name,
        saved_at
      FROM saved_articles
      ORDER BY saved_at DESC
      LIMIT ?
      `,
    )
    .all(limit);

  return rows.map(mapRowToSavedArticle);
}

export function listSavedArticleLinksByLinks(links) {
  const normalizedLinks = Array.from(
    new Set(
      (Array.isArray(links) ? links : [])
        .map((link) => String(link ?? "").trim())
        .filter(Boolean),
    ),
  );

  if (normalizedLinks.length === 0) {
    return new Set();
  }

  const placeholders = normalizedLinks.map(() => "?").join(", ");
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT link FROM saved_articles WHERE link IN (${placeholders})`)
    .all(...normalizedLinks);

  return new Set(rows.map((row) => row.link));
}

export function saveArticleForLater(payload) {
  const article = payload?.article ?? {};
  const page = payload?.page ?? {};
  const link = ensureNonEmptyText(article.link, "Article link");
  const title = ensureNonEmptyText(article.title, "Article title");
  const savedAt = new Date().toISOString();
  const db = getDatabase();

  db.prepare(
    `
    INSERT INTO saved_articles (
      id,
      article_id,
      title,
      link,
      summary,
      image_url,
      source_feed_id,
      source_title,
      source_url,
      published_at,
      published_label,
      page_id,
      page_name,
      saved_at
    ) VALUES (
      @id,
      @article_id,
      @title,
      @link,
      @summary,
      @image_url,
      @source_feed_id,
      @source_title,
      @source_url,
      @published_at,
      @published_label,
      @page_id,
      @page_name,
      @saved_at
    )
    ON CONFLICT(link) DO UPDATE SET
      article_id = excluded.article_id,
      title = excluded.title,
      summary = excluded.summary,
      image_url = excluded.image_url,
      source_feed_id = excluded.source_feed_id,
      source_title = excluded.source_title,
      source_url = excluded.source_url,
      published_at = excluded.published_at,
      published_label = excluded.published_label,
      page_id = excluded.page_id,
      page_name = excluded.page_name,
      saved_at = excluded.saved_at
    `,
  ).run({
    id: makeSavedArticleId(link),
    article_id: toNullableText(article.id),
    title,
    link,
    summary: toNullableText(article.summary),
    image_url: toNullableText(article.imageUrl),
    source_feed_id: toNullableText(article.sourceFeedId),
    source_title: toNullableText(article.sourceTitle),
    source_url: toNullableText(article.sourceUrl),
    published_at: toNullableText(article.publishedAt),
    published_label: toNullableText(article.publishedLabel),
    page_id: toNullableText(page.id),
    page_name: toNullableText(page.name),
    saved_at: savedAt,
  });

  const savedRow = db
    .prepare(
      `
      SELECT
        id,
        article_id,
        title,
        link,
        summary,
        image_url,
        source_feed_id,
        source_title,
        source_url,
        published_at,
        published_label,
        page_id,
        page_name,
        saved_at
      FROM saved_articles
      WHERE link = ?
      LIMIT 1
      `,
    )
    .get(link);

  return mapRowToSavedArticle(savedRow);
}

export function removeSavedArticleByLink(link) {
  const normalizedLink = ensureNonEmptyText(link, "Article link");
  const db = getDatabase();
  const result = db
    .prepare("DELETE FROM saved_articles WHERE link = ?")
    .run(normalizedLink);

  return result.changes > 0;
}
