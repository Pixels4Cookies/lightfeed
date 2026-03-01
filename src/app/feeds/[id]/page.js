/* eslint-disable @next/next/no-img-element */
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

function toSourceFilterValue(rawValue) {
  if (Array.isArray(rawValue)) {
    return toSourceFilterValue(rawValue[0]);
  }

  return String(rawValue ?? "").trim();
}

function toSafeHttpUrl(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function toSafeHostname(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) return null;

  try {
    const hostname = new URL(safeUrl).hostname.toLowerCase().replace(/\.$/, "");
    return hostname.replace(/^www\./i, "") || null;
  } catch {
    return null;
  }
}

function toLogoDevUrl(domain) {
  if (!domain) return null;

  const token = String(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? "").trim();
  const params = new URLSearchParams({
    size: "96",
    format: "webp",
    fallback: "404",
  });

  if (token) {
    params.set("token", token);
  }

  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params.toString()}`;
}

function toSourceImageUrl(sourceImage, sourceUrl) {
  return toLogoDevUrl(toSafeHostname(sourceUrl)) ?? toSafeHttpUrl(sourceImage);
}

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

export default async function FeedDetailPage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = getPageById(id);
  const selectedSource = toSourceFilterValue(resolvedSearchParams?.source);

  if (!page) {
    notFound();
  }

  return (
    <AppShell>
      <Suspense fallback={<FeedGhostList count={5} titleWidthClass="w-64" />}>
        <FeedDetailContent page={page} selectedSource={selectedSource} />
      </Suspense>
    </AppShell>
  );
}

async function FeedDetailContent({ page, selectedSource }) {
  const stream = await getPageFeedStream(page.id, { limit: 24 });
  const blend = stream.items;
  const feedErrors = stream.feedErrors;
  const sources = [];
  const sourceKeys = new Set();

  for (const article of blend) {
    const sourceId = toSourceFilterValue(article.sourceFeedId);
    if (!sourceId || sourceKeys.has(sourceId)) {
      continue;
    }

    sourceKeys.add(sourceId);
    sources.push({
      id: sourceId,
      title: article.sourceTitle || "Unknown source",
      imageUrl: toSourceImageUrl(article.sourceImage, article.sourceUrl),
    });
  }

  const hasSelectedSource =
    Boolean(selectedSource) && sources.some((source) => source.id === selectedSource);
  const visibleItems = hasSelectedSource
    ? blend.filter(
        (article) => toSourceFilterValue(article.sourceFeedId) === selectedSource,
      )
    : blend;
  const savedArticleLinks = listSavedArticleLinksByLinks(
    visibleItems.map((article) => article.link),
  );

  return (
    <>
      <section className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-center">
            <h2 className="mt-1 w-full font-serif text-4xl font-semibold tracking-tight text-stone-950 truncate dark:text-stone-100">
              {page.name}
            </h2>
            <Link 
              className="flex items-center gap-2 font-bold text-xs hover:text-stone-700 dark:text-stone-300 dark:hover:text-stone-100"
              href={`/feeds/${page.id}/edit`}>
              <LucideIcon icon={Settings} />
              Settings
            </Link>
          </div>
          {sources.length > 0 ? (
            <div className="mt-2 flex flex-row items-center gap-2">
              <span className="text-sm font-semibold text-stone-500">Sources:</span>
              {sources.map((source) => {
                const isSelected = source.id === selectedSource;

                return (
                  <Link
                    key={source.id}
                    href={`/feeds/${page.id}?source=${encodeURIComponent(source.id)}`}
                    aria-label={`Filter by ${source.title}`}
                    title={source.title}
                    className={`block h-8 w-8 overflow-hidden border border-stone-200 rounded-md ${
                      isSelected
                        ? "border-stone-950 ring-2 ring-stone-950/20 dark:border-stone-100 dark:ring-stone-100/40"
                        : "border-stone-300 hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500"
                    }`}
                  >
                    {source.imageUrl ? (
                      <img
                        src={source.imageUrl}
                        alt={source.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center rounded-md bg-stone-200 text-xs font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-100">
                        {source.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </Link>
                );
              })}

              {hasSelectedSource ? (
                <Link
                  href={`/feeds/${page.id}`}
                  className={`ml-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                    hasSelectedSource
                      ? "border-stone-300 text-stone-800 hover:border-stone-500 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:border-stone-500 dark:hover:text-stone-100"
                      : "border-stone-200 text-stone-400 dark:border-stone-800 dark:text-stone-600"
                  }`}
                >
                  Reset
                </Link>
              ) : null}
            </div>
          ) : null}
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
          {visibleItems.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              pageContext={{ id: page.id, name: page.name }}
              initialIsSaved={savedArticleLinks.has(article.link)}
            />
          ))}
        </ul>

        {visibleItems.length === 0 ? (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            {hasSelectedSource
              ? "No RSS items were returned for the selected source."
              : "No RSS items were returned for this feed."}
          </p>
        ) : null}
      </section>
    </>
  );
}
