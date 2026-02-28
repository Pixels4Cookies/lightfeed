"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { FeedRowsFields } from "@/components/feed-rows-fields";
import { NewsCard } from "@/components/news-card";
import {
  createInitialFeedRows,
  useEditableFeedRows,
} from "@/components/use-editable-feed-rows";
import { Button } from "@/components/button";
import LucideIcon from "@/components/lucide-icon";
import { PlusCircle } from "lucide";

export function CreateNewsFeedExperience() {
  const router = useRouter();
  const [pageName, setPageName] = useState("");
  const [isHomepage, setIsHomepage] = useState(false);
  const [previewState, setPreviewState] = useState({
    loading: false,
    error: "",
    feedErrors: [],
    items: [],
    fetchedAt: "",
  });
  const [saveState, setSaveState] = useState({
    loading: false,
    error: "",
  });
  const {
    rows,
    addRow,
    removeRow,
    updateRow,
    resolveFeeds,
  } = useEditableFeedRows({
    prefix: "create-feed-row",
    initialRows: createInitialFeedRows("create-feed-row", 2),
  });

  const handlePreview = async (event) => {
    event.preventDefault();

    try {
      const feeds = resolveFeeds();

      setPreviewState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      const response = await fetch("/api/preview-feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feeds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to preview feed.");
      }

      setPreviewState({
        loading: false,
        error: "",
        feedErrors: payload.data.feedErrors ?? [],
        items: payload.data.items ?? [],
        fetchedAt: payload.data.fetchedAt ?? "",
      });
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to preview feed.",
      }));
    }
  };

  const handleSavePage = async () => {
    try {
      const normalizedPageName = pageName.trim();

      if (!normalizedPageName) {
        setSaveState({
          loading: false,
          error: "Feed name is required.",
        });
        return;
      }

      const feeds = resolveFeeds();
      setSaveState({
        loading: true,
        error: "",
      });

      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedPageName,
          isHomepage,
          feeds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save feed.");
      }

      const createdPageId = payload?.data?.page?.id;
      if (!createdPageId) {
        throw new Error("Feed was created but no feed ID was returned.");
      }

      setSaveState({
        loading: false,
        error: "",
      });
      router.push(`/feeds/${createdPageId}`);
      router.refresh();
    } catch (error) {
      setSaveState({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to save feed.",
      });
    }
  };

  return (
    <section className=" ">
      <form
        className="space-y-6 rounded-xl border border-stone-900/10 bg-white/85 p-4 md:p-5 dark:border-stone-100/15 dark:bg-stone-900/70"
        onSubmit={handlePreview}
      >
        <div className="sticky top-3 z-10 rounded-lg border border-stone-300 bg-stone-50/95 p-3 backdrop-blur dark:border-stone-700 dark:bg-stone-900/90">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Create Feed</p>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Add sources, build preview, then save.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                disabled={previewState.loading || saveState.loading}
                variant="secondary"
              >
                {previewState.loading ? "Building preview..." : "Build Preview"}
              </Button>
              <Button
                type="button"
                onClick={handleSavePage}
                disabled={previewState.loading || saveState.loading}
              >
                {saveState.loading ? "Saving feed..." : "Save Feed"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-300">
            Feed Settings
          </span>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-950 md:text-2xl dark:text-stone-100">
            Create New Feed
          </h1>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-600 dark:text-stone-300">
            Feed Name
          </span>
          <input
            type="text"
            value={pageName}
            onChange={(event) => setPageName(event.target.value)}
            placeholder="My Custom Feed"
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-0 focus:border-sky-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-300"
          />
        </label>

        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Feed Sources</p>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Add RSS sources. Articles are ordered by publish date (newest first).
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-4 text-sm font-medium text-stone-700 dark:text-stone-300">
              <span className="flex-1">Feed Details</span>
              <span className="w-[40px]"></span>
            </div>
            <FeedRowsFields
              rows={rows}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
            />
          </div>
          <div className="flex flex-row mt-4 gap-4 items-center pt-2">
            <Button onClick={addRow} variant="secondary">
              <LucideIcon icon={PlusCircle} />
              Add RSS Feed
            </Button>
          </div>
        </div>

        <div className="border border-stone-200 rounded-lg p-4 flex flex-row gap-2 items-center dark:border-stone-700 dark:bg-stone-900/60">
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Homepage Feed</p>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Use this feed on the homepage.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <input
              type="checkbox"
              checked={isHomepage}
              onChange={(event) => setIsHomepage(event.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500 dark:border-stone-600"
            />
            Use this feed on the homepage
          </label>
        </div>

        {previewState.error ? (
          <Alert tone="error">{previewState.error}</Alert>
        ) : null}

        {saveState.error ? (
          <Alert tone="error">{saveState.error}</Alert>
        ) : null}

        {previewState.feedErrors.length > 0 ? (
          <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
            <Alert
              tone="warning"
              title={`Feed Errors (${previewState.feedErrors.length})`}
            >
              <ul className="mt-2 space-y-1">
                {previewState.feedErrors.map((error) => (
                  <li key={error.feedId}>
                    {error.feedTitle}: {error.message}
                  </li>
                ))}
              </ul>
            </Alert>
          </div>
        ) : null}

        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Preview Articles</h2>
            {previewState.fetchedAt ? (
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Fetched {new Date(previewState.fetchedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          {previewState.items.length === 0 ? (
            <p className="mt-3 rounded-md border border-stone-900/10 bg-stone-50/70 px-3 py-2 text-sm text-stone-600 dark:border-stone-100/15 dark:bg-stone-800/70 dark:text-stone-300">
              Build a preview to fetch RSS items.
            </p>
          ) : (
            <ul className="mt-4 space-y-8">
              {previewState.items.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </ul>
          )}
        </div>
      </form>
    </section>
  );
}
