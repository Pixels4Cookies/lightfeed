"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";
import { FeedRowsFields } from "@/components/feed-rows-fields";
import {
  mapFeedMixToEditableRows,
  useEditableFeedRows,
} from "@/components/use-editable-feed-rows";
import { Button } from "@/components/button";
import LucideIcon from "./lucide-icon";
import { PlusCircle } from "lucide";

export function PageSettingsExperience({ page, feedMix }) {
  const router = useRouter();
  const deleteDialogRef = useRef(null);

  const [pageName, setPageName] = useState(page.name);
  const [isHomepage, setIsHomepage] = useState(page.isHomepage);
  const [status, setStatus] = useState({
    loading: false,
    deleting: false,
    error: "",
    success: "",
  });
  const {
    rows,
    addRow,
    removeRow,
    updateRow,
    resolveFeeds,
  } = useEditableFeedRows({
    prefix: "settings-feed-row",
    initialRows: mapFeedMixToEditableRows(feedMix, "settings-feed-row"),
  });

  const openDeleteDialog = () => {
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteDialog = () => {
    deleteDialogRef.current?.close();
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      const normalizedPageName = pageName.trim();
      if (!normalizedPageName) {
        setStatus((current) => ({
          ...current,
          error: "Feed name is required.",
          success: "",
        }));
        return;
      }

      const feeds = resolveFeeds();

      setStatus((current) => ({
        ...current,
        loading: true,
        error: "",
        success: "",
      }));

      const response = await fetch(`/api/feeds/${page.id}`, {
        method: "PATCH",
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
        throw new Error(payload?.error || "Unable to update feed settings.");
      }

      setStatus((current) => ({
        ...current,
        loading: false,
        error: "",
        success: "Feed settings saved.",
      }));
      router.refresh();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to update feed settings.",
        success: "",
      }));
    }
  };

  const handleDelete = async () => {
    try {
      setStatus((current) => ({
        ...current,
        deleting: true,
        error: "",
        success: "",
      }));

      const response = await fetch(`/api/feeds/${page.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete feed.");
      }

      closeDeleteDialog();
      router.push("/");
      router.refresh();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        deleting: false,
        error: error instanceof Error ? error.message : "Unable to delete feed.",
        success: "",
      }));
    }
  };

  return (
    <>
      <section className=" ">
        <form
          className="space-y-6 rounded-xl border border-stone-900/10 bg-white/85 p-4 md:p-5 dark:border-stone-100/15 dark:bg-stone-900/70"
          onSubmit={handleSave}
        >
          <div className="sticky top-3 z-10 rounded-lg border border-stone-300 bg-stone-50/95 p-3 backdrop-blur dark:border-stone-700 dark:bg-stone-900/90">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Feed Configuration</p>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Update settings and save changes.
                </p>
              </div>
              <Button
                type="submit"
                disabled={status.loading || status.deleting}
              >
                {status.loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-stone-600 dark:text-stone-300">
                  Feed Settings
                </span>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-950 md:text-2xl dark:text-stone-100">
                  {page.name}
                </h1>
              </div>
              {isHomepage ? (
                <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border-stone-200 bg-stone-50 text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
                  Homepage Feed
                </span>
              ) : null }
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-600 dark:text-stone-300">
              Feed Name
            </span>
            <input
              type="text"
              value={pageName}
              onChange={(event) => setPageName(event.target.value)}
              placeholder="Feed name"
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-0 focus:border-sky-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-300"
            />
          </label>

          <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Feed Sources</p>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Articles are sorted by publish date (newest first).
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

          {status.error ? (
            <Alert tone="error">{status.error}</Alert>
          ) : null}

          {status.success ? (
            <Alert tone="success">{status.success}</Alert>
          ) : null}

          <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-300">Danger Zone</h2>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
              Deleting this feed will permanently remove all its configuration.
            </p>
            <div className="mt-4">
              <Button
                variant="danger"
                onClick={openDeleteDialog}
                disabled={status.loading || status.deleting}
              >
                Delete Feed
              </Button>
            </div>
          </div>
        </form>
      </section>

      <dialog
        ref={deleteDialogRef}
        className="fixed inset-0 m-auto w-[min(480px,calc(100vw-2rem))] border-0 bg-transparent p-0 [&::backdrop]:bg-stone-950/40 [&::backdrop]:backdrop-blur-[2px]"
      >
        <div className="rounded-2xl border border-stone-900/12 bg-stone-50 p-4 dark:border-stone-100/15 dark:bg-stone-900">
          <h3 className="text-lg font-semibold tracking-tight text-stone-950 dark:text-stone-100">Delete feed?</h3>
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            This will remove <span className="font-semibold">{page.name}</span> and its feed
            mix configuration.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={closeDeleteDialog}
              disabled={status.deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={status.deleting}
            >
              {status.deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
