import Link from "next/link";
import { Suspense } from "react";
import { Settings } from "lucide";
import { Alert } from "@/components/alert";
import { AppShell } from "@/components/app-shell";
import LucideIcon from "@/components/lucide-icon";
import { FeedGhostList } from "@/components/feed-ghost-list";
import { NewsCard } from "@/components/news-card";
import { getHomepagePage } from "@/lib/lightfeed-data";
import { getPageFeedStream } from "@/lib/rss-stream";
import { listSavedArticleLinksByLinks } from "@/lib/saved-articles-db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Home",
  description: "Your latest headlines from configured RSS feeds.",
};

export default function HomePage() {
  const activePage = getHomepagePage();

  return (
    <AppShell>
      <Suspense
        fallback={
          <FeedGhostList
            count={6}
            titleWidthClass={activePage ? "w-72" : "w-56"}
          />
        }
      >
        <HomeFeedSection activePage={activePage} />
      </Suspense>
    </AppShell>
  );
}

async function HomeFeedSection({ activePage }) {
  const stream = activePage
    ? await getPageFeedStream(activePage.id, { limit: 28 })
    : { items: [], feedErrors: [], fetchedAt: null };

  const feedItems = stream.items;
  const feedErrors = stream.feedErrors;
  const savedArticleLinks = listSavedArticleLinksByLinks(
    feedItems.map((article) => article.link),
  );

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="">
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
            {activePage?.name ?? "No Feed Selected"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activePage ? (
            <Link
              className="flex items-center gap-2 font-bold text-xs hover:text-stone-700 dark:text-stone-300 dark:hover:text-stone-100"
              href={`/feeds/${activePage.id}/edit`}
              aria-label={`${activePage.name} settings`}
              title="Feed settings"
            >
              <LucideIcon icon={Settings} />
              Settings
            </Link>
          ) : (
            <Link className="flex items-center gap-2 font-bold text-xs hover:underline" href="/feeds">
              Manage Feeds
            </Link>
          )}
        </div>
      </div>

      {feedErrors.length > 0 ? (
        <Alert
          tone="warning"
          className="mt-4 text-xs"
          title={`Failed feeds (${feedErrors.length}) - available feeds are still shown.`}
        >
          <ul className="mt-2 space-y-1">
            {feedErrors.map((error) => (
              <li key={error.feedId}>
                <span className="font-semibold">{error.feedTitle}</span>
                {" · "}
                {activePage ? (
                  <Link href={`/feeds/${activePage.id}`} className="underline">
                    {activePage.name}
                  </Link>
                ) : (
                  <span>Unknown feed</span>
                )}
                {" · "}
                {error.message}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <ul className="mt-4 space-y-8">
        {feedItems.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            pageContext={activePage ? { id: activePage.id, name: activePage.name } : null}
            initialIsSaved={savedArticleLinks.has(article.link)}
          />
        ))}
      </ul>

      {feedItems.length === 0 ? (
        <p className="mt-5 text-sm text-stone-700 dark:text-stone-300">
          No articles available for this feed right now.
        </p>
      ) : null}
    </section>
  );
}
