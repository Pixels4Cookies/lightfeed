CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_homepage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feeds (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE page_feeds (
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  feed_id TEXT REFERENCES feeds(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, feed_id)
);

CREATE TABLE saved_articles (
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
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_feeds_feed_id ON page_feeds (feed_id);
CREATE INDEX idx_pages_homepage ON pages (is_homepage);
CREATE INDEX idx_saved_articles_saved_at ON saved_articles (saved_at DESC);
