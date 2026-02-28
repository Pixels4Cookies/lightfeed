import "server-only";
import { createHash } from "node:crypto";
import { inferFeedTitleFromUrl } from "@/lib/feed-utils";
import { getLightfeedDatabase, runWriteTransaction } from "@/lib/lightfeed-db";

function ensureNonEmptyText(value, fieldName) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function ensureUrl(value, fieldName) {
  const normalized = ensureNonEmptyText(value, fieldName);
  let parsedUrl;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${fieldName} must use http or https.`);
  }

  return parsedUrl.toString();
}

function toNullableText(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function mapPageRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    isHomepage: Boolean(row.is_homepage),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
  };
}

function makePageId(db, requestedId, pageName) {
  const preferredBase = slugify(requestedId) || slugify(pageName) || "feed";
  let candidate = preferredBase;
  let index = 2;

  while (true) {
    const existing = db
      .prepare("SELECT 1 FROM pages WHERE id = ? LIMIT 1")
      .get(candidate);

    if (!existing) {
      return candidate;
    }

    candidate = `${preferredBase}-${index}`;
    index += 1;
  }
}

function makeFeedId(url) {
  return `feed-${createHash("sha256").update(url).digest("hex").slice(0, 24)}`;
}

function normalizeCreateFeed(feed, index) {
  const url = ensureUrl(feed?.url, `Feed ${index + 1} URL`);

  return {
    url,
    title: toNullableText(feed?.title) ?? inferFeedTitleFromUrl(url),
  };
}

function ensureUniqueFeedUrls(feeds) {
  const feedUrlSet = new Set();

  for (const feed of feeds) {
    if (feedUrlSet.has(feed.url)) {
      throw new Error("Duplicate feed URLs are not allowed.");
    }
    feedUrlSet.add(feed.url);
  }
}

function cleanupOrphanFeeds(db) {
  db.prepare(
    `
    DELETE FROM feeds
    WHERE id NOT IN (
      SELECT DISTINCT feed_id
      FROM page_feeds
    )
    `,
  ).run();
}

function writePageFeedMix(db, pageId, feeds, createdAt, options = {}) {
  const replaceExisting = options.replaceExisting === true;

  if (replaceExisting) {
    db.prepare("DELETE FROM page_feeds WHERE page_id = ?").run(pageId);
  }

  const upsertFeed = db.prepare(`
    INSERT INTO feeds (id, url, title, created_at)
    VALUES (@id, @url, @title, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      title = COALESCE(excluded.title, feeds.title)
  `);

  const insertPageFeed = db.prepare(`
    INSERT INTO page_feeds (page_id, feed_id)
    VALUES (@page_id, @feed_id)
  `);

  for (const feed of feeds) {
    const feedId = makeFeedId(feed.url);

    upsertFeed.run({
      id: feedId,
      url: feed.url,
      title: feed.title,
      created_at: createdAt,
    });

    insertPageFeed.run({
      page_id: pageId,
      feed_id: feedId,
    });
  }

  if (replaceExisting) {
    cleanupOrphanFeeds(db);
  }
}

export function listPages() {
  const db = getLightfeedDatabase();
  const rows = db
    .prepare(
      `
      SELECT id, name, is_homepage, sort_order, created_at
      FROM pages
      ORDER BY sort_order ASC, created_at ASC, id ASC
      `,
    )
    .all();

  return rows.map(mapPageRow);
}

export function listPagesWithStats() {
  const db = getLightfeedDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        p.id,
        p.name,
        p.is_homepage,
        p.sort_order,
        p.created_at,
        COUNT(pf.feed_id) AS feed_count
      FROM pages p
      LEFT JOIN page_feeds pf ON pf.page_id = p.id
      GROUP BY p.id
      ORDER BY p.sort_order ASC, p.created_at ASC, p.id ASC
      `,
    )
    .all();

  return rows.map((row) => ({
    ...mapPageRow(row),
    feedCount: Number(row.feed_count ?? 0),
  }));
}

export function getPageById(pageId) {
  const normalizedPageId = String(pageId ?? "").trim();
  if (!normalizedPageId) return null;

  const db = getLightfeedDatabase();
  const row = db
    .prepare(
      `
      SELECT id, name, is_homepage, sort_order, created_at
      FROM pages
      WHERE id = ?
      LIMIT 1
      `,
    )
    .get(normalizedPageId);

  return mapPageRow(row);
}

export function getHomepagePage() {
  const db = getLightfeedDatabase();
  const row = db
    .prepare(
      `
      SELECT id, name, is_homepage, sort_order, created_at
      FROM pages
      ORDER BY is_homepage DESC, sort_order ASC, created_at ASC
      LIMIT 1
      `,
    )
    .get();

  return mapPageRow(row);
}

export function listPageFeedMix(pageId) {
  const normalizedPageId = String(pageId ?? "").trim();
  if (!normalizedPageId) return [];

  const db = getLightfeedDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        pf.page_id,
        pf.feed_id,
        f.title,
        f.url
      FROM page_feeds pf
      JOIN feeds f ON f.id = pf.feed_id
      WHERE pf.page_id = ?
      ORDER BY f.title COLLATE NOCASE ASC, pf.feed_id ASC
      `,
    )
    .all(normalizedPageId);

  return rows.map((row) => ({
    pageId: row.page_id,
    feedId: row.feed_id,
    title: row.title || "Unknown Feed",
    url: row.url || "",
  }));
}

export function createPage(payload) {
  const db = getLightfeedDatabase();
  const name = ensureNonEmptyText(payload?.name, "Feed name");
  const rawFeeds = Array.isArray(payload?.feeds) ? payload.feeds : [];

  if (rawFeeds.length === 0) {
    throw new Error("At least one feed is required.");
  }

  const normalizedFeeds = rawFeeds.map((feed, index) =>
    normalizeCreateFeed(feed, index),
  );
  ensureUniqueFeedUrls(normalizedFeeds);

  const isHomepage = Boolean(payload?.isHomepage);
  const pageId = makePageId(db, payload?.id, name);
  const createdAt = new Date().toISOString();
  const nextSortOrder =
    Number(
      db
        .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS sort_order FROM pages")
        .get()?.sort_order,
    ) || 1;

  runWriteTransaction(db, () => {
    if (isHomepage) {
      db.prepare("UPDATE pages SET is_homepage = 0 WHERE is_homepage = 1").run();
    }

    db.prepare(
      `
      INSERT INTO pages (id, name, is_homepage, sort_order, created_at)
      VALUES (@id, @name, @is_homepage, @sort_order, @created_at)
      `,
    ).run({
      id: pageId,
      name,
      is_homepage: isHomepage ? 1 : 0,
      sort_order: nextSortOrder,
      created_at: createdAt,
    });

    writePageFeedMix(db, pageId, normalizedFeeds, createdAt);
  });

  return {
    page: getPageById(pageId),
    feedMix: listPageFeedMix(pageId),
  };
}

export function reorderPages(pageIds) {
  const normalizedPageIds = Array.isArray(pageIds)
    ? pageIds
        .map((pageId) => String(pageId ?? "").trim())
        .filter((pageId) => pageId.length > 0)
    : [];

  if (normalizedPageIds.length === 0) {
    throw new Error("Feed order is required.");
  }

  const uniquePageIds = new Set(normalizedPageIds);
  if (uniquePageIds.size !== normalizedPageIds.length) {
    throw new Error("Feed order contains duplicate entries.");
  }

  const db = getLightfeedDatabase();
  const existingPageRows = db.prepare("SELECT id FROM pages").all();

  if (existingPageRows.length === 0) {
    return [];
  }

  if (normalizedPageIds.length !== existingPageRows.length) {
    throw new Error("Feed order must include all feeds.");
  }

  const existingPageIds = new Set(existingPageRows.map((page) => page.id));
  for (const pageId of normalizedPageIds) {
    if (!existingPageIds.has(pageId)) {
      throw new Error(`Feed "${pageId}" was not found.`);
    }
  }

  runWriteTransaction(db, () => {
    const updateSortOrder = db.prepare(`
      UPDATE pages
      SET sort_order = @sort_order
      WHERE id = @id
    `);

    normalizedPageIds.forEach((pageId, index) => {
      updateSortOrder.run({
        id: pageId,
        sort_order: index + 1,
      });
    });
  });

  return listPages();
}

export function updatePage(pageId, payload) {
  const normalizedPageId = String(pageId ?? "").trim();
  if (!normalizedPageId) {
    throw new Error("Feed ID is required.");
  }

  const db = getLightfeedDatabase();
  const existingPage = getPageById(normalizedPageId);

  if (!existingPage) {
    throw new Error("Feed not found.");
  }

  const hasNameUpdate = Object.prototype.hasOwnProperty.call(payload ?? {}, "name");
  const hasHomepageUpdate = Object.prototype.hasOwnProperty.call(
    payload ?? {},
    "isHomepage",
  );
  const hasFeedsUpdate = Object.prototype.hasOwnProperty.call(payload ?? {}, "feeds");

  if (!hasNameUpdate && !hasHomepageUpdate && !hasFeedsUpdate) {
    throw new Error("No updates were provided.");
  }

  const nextName = hasNameUpdate
    ? ensureNonEmptyText(payload?.name, "Feed name")
    : existingPage.name;
  const nextIsHomepage = hasHomepageUpdate
    ? Boolean(payload?.isHomepage)
    : existingPage.isHomepage;

  let normalizedFeeds = null;

  if (hasFeedsUpdate) {
    const rawFeeds = Array.isArray(payload?.feeds) ? payload.feeds : [];
    if (rawFeeds.length === 0) {
      throw new Error("At least one feed is required.");
    }

    normalizedFeeds = rawFeeds.map((feed, index) =>
      normalizeCreateFeed(feed, index),
    );
    ensureUniqueFeedUrls(normalizedFeeds);
  }

  runWriteTransaction(db, () => {
    if (nextIsHomepage) {
      db
        .prepare("UPDATE pages SET is_homepage = 0 WHERE id != ? AND is_homepage = 1")
        .run(normalizedPageId);
    }

    db.prepare(
      `
      UPDATE pages
      SET name = @name,
          is_homepage = @is_homepage
      WHERE id = @id
      `,
    ).run({
      id: normalizedPageId,
      name: nextName,
      is_homepage: nextIsHomepage ? 1 : 0,
    });

    if (normalizedFeeds) {
      writePageFeedMix(db, normalizedPageId, normalizedFeeds, new Date().toISOString(), {
        replaceExisting: true,
      });
    }
  });

  return {
    page: getPageById(normalizedPageId),
    feedMix: listPageFeedMix(normalizedPageId),
  };
}

export function deletePage(pageId) {
  const normalizedPageId = String(pageId ?? "").trim();
  if (!normalizedPageId) return false;

  const db = getLightfeedDatabase();
  const existingPage = getPageById(normalizedPageId);
  if (!existingPage) return false;

  runWriteTransaction(db, () => {
    db.prepare("DELETE FROM pages WHERE id = ?").run(normalizedPageId);
    cleanupOrphanFeeds(db);
  });

  return true;
}
