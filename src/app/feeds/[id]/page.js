import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Alert } from "@/components/alert";
import { AppShell } from "@/components/app-shell";
import { FeedGhostList } from "@/components/feed-ghost-list";
import { NewsCard } from "@/components/news-card";
import { getPageById } from "@/lib/lightfeed-data";
import { getPageFeedStream } from "@/lib/rss-stream";
import { listSavedArticleLinksByLinks } from "@/lib/saved-articles-db";
import LucideIcon from "@/components/lucide-icon";
import { Settings } from "lucide";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) {
    return {
      title: "Feed Not Found",
      description: "The requested feed does not exist.",
    };
  }

  return {
    title: page.name,
    description: `Latest articles from the ${page.name} feed.`,
  };
}

export default async function FeedDetailPage({ params }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <AppShell>
      <Suspense fallback={<FeedGhostList count={5} titleWidthClass="w-64" />}>
        <FeedDetailContent page={page} />
      </Suspense>
    </AppShell>
  );
}

async function FeedDetailContent({ page }) {
  const stream = await getPageFeedStream(page.id, { limit: 24 });
  const blend = stream.items;
  const feedErrors = stream.feedErrors;
  const savedArticleLinks = listSavedArticleLinksByLinks(
    blend.map((article) => article.link),
  );

  return (
    <>
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-600 dark:text-stone-300">
              News Feed
            </p>
            <h2 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
              {page.name}
            </h2>
          </div>
          <Link className="flex gap-2 items-center text-xs hover:underline font-bold dark:text-stone-300" href={`/feeds/${page.id}/edit`}>
            <LucideIcon icon={Settings} />
            Settings
          </Link>
        </div>

        {feedErrors.length > 0 ? (
          <Alert
            tone="warning"
            className="mt-4 text-xs"
            title={`Failed feeds (${feedErrors.length}) for this feed.`}
          >
            <ul className="mt-2 space-y-1">
              {feedErrors.map((error) => (
                <li key={error.feedId}>
                  <span className="font-semibold">{error.feedTitle}</span>
                  {" · "}
                  <Link href={`/feeds/${page.id}`} className="underline">
                    {page.name}
                  </Link>
                  {" · "}
                  {error.message}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </section>

      <section className=" ">
        <ul className="space-y-8">
          {blend.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              pageContext={{ id: page.id, name: page.name }}
              initialIsSaved={savedArticleLinks.has(article.link)}
            />
          ))}
        </ul>

        {blend.length === 0 ? (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            No RSS items were returned for this feed.
          </p>
        ) : null}
      </section>
    </>
  );
}
