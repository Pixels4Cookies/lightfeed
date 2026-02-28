import "server-only";
import feedCatalog from "@/lib/rss-feed-catalog.json";

export const FEEDS_PER_PREDEFINED_PAGE = 5;

const PREDEFINED_PAGES = [
  {
    id: "news",
    name: "News",
    category: "News",
    isHomepage: true,
    createdAt: "2026-02-20T08:00:00.000Z",
  },
  {
    id: "tech",
    name: "Tech",
    category: "Tech",
    isHomepage: false,
    createdAt: "2026-02-20T08:05:00.000Z",
  },
  {
    id: "finance",
    name: "Finance",
    category: "Finance",
    isHomepage: false,
    createdAt: "2026-02-20T08:10:00.000Z",
  },
  {
    id: "sport",
    name: "Sport",
    category: "Sport",
    isHomepage: false,
    createdAt: "2026-02-20T08:15:00.000Z",
  },
  {
    id: "media",
    name: "Media",
    category: "Media",
    isHomepage: false,
    createdAt: "2026-02-20T08:20:00.000Z",
  },
];

export const LEGACY_PREDEFINED_PAGE_IDS = ["envirolment"];

export const PREDEFINED_PAGE_IDS = PREDEFINED_PAGES.map((page) => page.id);

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildPredefinedFeedSeeds() {
  const seedFeeds = [];
  const seedPageFeeds = [];

  PREDEFINED_PAGES.forEach((page, pageIndex) => {
    const categoryFeeds = feedCatalog
      .filter((feed) => feed.category === page.category)
      .slice(0, FEEDS_PER_PREDEFINED_PAGE);

    if (categoryFeeds.length < FEEDS_PER_PREDEFINED_PAGE) {
      throw new Error(
        `Expected at least ${FEEDS_PER_PREDEFINED_PAGE} feeds for ${page.category}.`,
      );
    }

    categoryFeeds.forEach((feed, feedIndex) => {
      const feedId = `${page.id}-${slugify(feed.feedName)}-${feedIndex + 1}`;
      const createdAt = new Date(
        Date.UTC(2026, 1, 20, 8, pageIndex * 5 + feedIndex + 1),
      ).toISOString();

      seedFeeds.push({
        id: feedId,
        title: feed.feedName,
        url: feed.feedLink,
        createdAt,
      });

      seedPageFeeds.push({
        pageId: page.id,
        feedId,
      });
    });
  });

  return {
    seedFeeds,
    seedPageFeeds,
  };
}

export const seedPages = PREDEFINED_PAGES.map((page) => ({
  id: page.id,
  name: page.name,
  isHomepage: page.isHomepage,
  createdAt: page.createdAt,
}));

const predefinedFeedSeeds = buildPredefinedFeedSeeds();

export const seedFeeds = predefinedFeedSeeds.seedFeeds;

export const seedPageFeeds = predefinedFeedSeeds.seedPageFeeds;
