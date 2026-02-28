import "server-only";
import {
  LEGACY_PREDEFINED_PAGE_IDS,
  PREDEFINED_PAGE_IDS,
  seedFeeds,
  seedPageFeeds,
  seedPages,
} from "@/lib/lightfeed-seed-data";
import { getSqliteDatabase } from "@/lib/sqlite";

let initialized = false;

const LEGACY_FEED_REPLACEMENTS = [
  {
    oldUrl: "https://feeds.reuters.com/Reuters/worldNews",
    newTitle: "Associated Press - Top News",
    newUrl: "https://apnews.com/hub/ap-top-news?output=rss",
  },
  {
    oldUrl: "https://feeds.reuters.com/reuters/businessNews",
    newTitle: "BBC News - Business",
    newUrl: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    oldUrl: "https://feeds.reuters.com/reuters/sportsNews",
    newTitle: "ESPN - MLB News",
    newUrl: "https://www.espn.com/espn/rss/mlb/news",
  },
  {
    oldUrl: "https://www.hollywoodreporter.com/t/feed/",
    newTitle: "TheWrap",
    newUrl: "https://www.thewrap.com/feed/",
  },
];

function isDatabaseBusyError(error) {
  return (
    error instanceof Error &&
    /database is locked|database is busy|SQLITE_BUSY/i.test(error.message)
  );
}

function runWithBusyRetry(operation, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      if (!isDatabaseBusyError(error) || attempt >= attempts) {
        throw error;
      }
    }
  }

  throw new Error("Database is busy.");
}

export function runWriteTransaction(db, operation) {
  return runWithBusyRetry(() => {
    db.exec("BEGIN IMMEDIATE");

    try {
      const result = operation();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // Ignore rollback errors after a failed write attempt.
      }

      throw error;
    }
  });
}

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_homepage INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feeds (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_feeds (
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
      PRIMARY KEY (page_id, feed_id)
    );

    CREATE INDEX IF NOT EXISTS idx_page_feeds_feed_id ON page_feeds(feed_id);
    CREATE INDEX IF NOT EXISTS idx_pages_homepage ON pages(is_homepage);
    CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);
  `);
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

function normalizePageSortOrder(db) {
  const pageRows = db
    .prepare(
      `
      SELECT id, COALESCE(sort_order, 0) AS sort_order, created_at
      FROM pages
      ORDER BY COALESCE(sort_order, 0) ASC, created_at ASC, id ASC
      `,
    )
    .all();

  if (pageRows.length === 0) {
    return;
  }

  const updateSortOrder = db.prepare(`
    UPDATE pages
    SET sort_order = @sort_order
    WHERE id = @id
  `);

  pageRows.forEach((page, index) => {
    const expectedOrder = index + 1;

    if (Number(page.sort_order) === expectedOrder) {
      return;
    }

    updateSortOrder.run({
      id: page.id,
      sort_order: expectedOrder,
    });
  });
}

function hasLegacyPredefinedPages(db) {
  const selectLegacyPage = db.prepare(`
    SELECT 1
    FROM pages
    WHERE id = ?
    LIMIT 1
  `);

  return LEGACY_PREDEFINED_PAGE_IDS.some((pageId) => Boolean(selectLegacyPage.get(pageId)));
}

function migrateLegacyPredefinedPages(db) {
  if (!hasLegacyPredefinedPages(db)) {
    return;
  }

  runWriteTransaction(db, () => {
    const upsertPage = db.prepare(`
      INSERT INTO pages (id, name, is_homepage, sort_order, created_at)
      VALUES (@id, @name, @is_homepage, @sort_order, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_homepage = excluded.is_homepage,
        sort_order = excluded.sort_order
    `);

    for (const [index, page] of seedPages.entries()) {
      upsertPage.run({
        id: page.id,
        name: page.name,
        is_homepage: page.isHomepage ? 1 : 0,
        sort_order: index + 1,
        created_at: page.createdAt,
      });
    }

    const deleteLegacyPage = db.prepare("DELETE FROM pages WHERE id = ?");
    for (const legacyPageId of LEGACY_PREDEFINED_PAGE_IDS) {
      deleteLegacyPage.run(legacyPageId);
    }

    const upsertFeed = db.prepare(`
      INSERT INTO feeds (id, url, title, created_at)
      VALUES (@id, @url, @title, @created_at)
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        title = excluded.title
    `);

    for (const feed of seedFeeds) {
      upsertFeed.run({
        id: feed.id,
        url: feed.url,
        title: feed.title,
        created_at: feed.createdAt,
      });
    }

    const deletePageFeeds = db.prepare("DELETE FROM page_feeds WHERE page_id = ?");
    for (const pageId of PREDEFINED_PAGE_IDS) {
      deletePageFeeds.run(pageId);
    }

    const insertPageFeed = db.prepare(`
      INSERT INTO page_feeds (page_id, feed_id)
      VALUES (@page_id, @feed_id)
    `);

    for (const item of seedPageFeeds) {
      insertPageFeed.run({
        page_id: item.pageId,
        feed_id: item.feedId,
      });
    }

    cleanupOrphanFeeds(db);
  });
}

function migrateLegacyFeeds(db) {
  const selectFeedByUrl = db.prepare(`
    SELECT id
    FROM feeds
    WHERE url = ?
    LIMIT 1
  `);

  const updateFeedById = db.prepare(`
    UPDATE feeds
    SET title = @title, url = @new_url
    WHERE id = @id
  `);

  const insertPageFeedMapping = db.prepare(`
    INSERT OR IGNORE INTO page_feeds (page_id, feed_id)
    SELECT page_id, @new_feed_id
    FROM page_feeds
    WHERE feed_id = @old_feed_id
  `);

  const deleteOldPageFeedMapping = db.prepare(`
    DELETE FROM page_feeds
    WHERE feed_id = ?
  `);

  const deleteFeedById = db.prepare(`
    DELETE FROM feeds
    WHERE id = ?
  `);

  for (const replacement of LEGACY_FEED_REPLACEMENTS) {
    const oldFeed = selectFeedByUrl.get(replacement.oldUrl);
    if (!oldFeed) {
      continue;
    }

    const newFeed = selectFeedByUrl.get(replacement.newUrl);
    if (newFeed && newFeed.id !== oldFeed.id) {
      insertPageFeedMapping.run({
        new_feed_id: newFeed.id,
        old_feed_id: oldFeed.id,
      });
      deleteOldPageFeedMapping.run(oldFeed.id);
      deleteFeedById.run(oldFeed.id);
      continue;
    }

    updateFeedById.run({
      id: oldFeed.id,
      title: replacement.newTitle,
      new_url: replacement.newUrl,
    });
  }
}

function migrateDatabase(db) {
  const pageFeedColumns = db.prepare("PRAGMA table_info(page_feeds)").all();
  const hasWeightColumn = pageFeedColumns.some((column) => column.name === "weight");
  const pageColumns = db.prepare("PRAGMA table_info(pages)").all();
  const hasSortOrderColumn = pageColumns.some((column) => column.name === "sort_order");

  if (hasWeightColumn) {
    runWriteTransaction(db, () => {
      db.exec(`
        CREATE TABLE page_feeds_next (
          page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
          feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
          PRIMARY KEY (page_id, feed_id)
        );
      `);

      db.exec(`
        INSERT INTO page_feeds_next (page_id, feed_id)
        SELECT page_id, feed_id
        FROM page_feeds
        GROUP BY page_id, feed_id
      `);

      db.exec("DROP TABLE page_feeds;");
      db.exec("ALTER TABLE page_feeds_next RENAME TO page_feeds;");
      db.exec("CREATE INDEX IF NOT EXISTS idx_page_feeds_feed_id ON page_feeds(feed_id);");
    });
  }

  if (!hasSortOrderColumn) {
    runWriteTransaction(db, () => {
      db.exec("ALTER TABLE pages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;");
      normalizePageSortOrder(db);
    });
  } else {
    runWriteTransaction(db, () => {
      normalizePageSortOrder(db);
    });
  }

  migrateLegacyPredefinedPages(db);
  runWriteTransaction(db, () => {
    migrateLegacyFeeds(db);
    cleanupOrphanFeeds(db);
  });
}

function seedDatabase(db) {
  const existingCount = db
    .prepare("SELECT COUNT(*) AS count FROM pages")
    .get()?.count;

  if (Number(existingCount) > 0) {
    return;
  }

  runWriteTransaction(db, () => {
    const insertPage = db.prepare(`
      INSERT INTO pages (id, name, is_homepage, sort_order, created_at)
      VALUES (@id, @name, @is_homepage, @sort_order, @created_at)
    `);

    for (const [index, page] of seedPages.entries()) {
      insertPage.run({
        id: page.id,
        name: page.name,
        is_homepage: page.isHomepage ? 1 : 0,
        sort_order: index + 1,
        created_at: page.createdAt,
      });
    }

    const insertFeed = db.prepare(`
      INSERT INTO feeds (id, url, title, created_at)
      VALUES (@id, @url, @title, @created_at)
    `);

    for (const feed of seedFeeds) {
      insertFeed.run({
        id: feed.id,
        url: feed.url,
        title: feed.title,
        created_at: feed.createdAt,
      });
    }

    const insertPageFeed = db.prepare(`
      INSERT INTO page_feeds (page_id, feed_id)
      VALUES (@page_id, @feed_id)
    `);

    for (const item of seedPageFeeds) {
      insertPageFeed.run({
        page_id: item.pageId,
        feed_id: item.feedId,
      });
    }
  });
}

export function getLightfeedDatabase() {
  const db = getSqliteDatabase();

  if (initialized) {
    return db;
  }

  ensureSchema(db);
  migrateDatabase(db);
  seedDatabase(db);
  initialized = true;

  return db;
}
