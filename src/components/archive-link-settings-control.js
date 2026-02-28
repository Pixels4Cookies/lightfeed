"use client";

import {
  writeArchiveLinksPreference,
} from "@/lib/archive-link-preference";
import { useArchiveLinksPreference } from "@/components/use-archive-links-preference";

export function ArchiveLinkSettingsControl() {
  const openWithArchive = useArchiveLinksPreference();

  const setPreference = (nextValue) => {
    writeArchiveLinksPreference(nextValue);
  };

  return (
    <div className="rounded-xl border border-stone-900/8 bg-white/70 p-4 dark:border-stone-100/15 dark:bg-stone-900/60">
      <p className="text-sm font-semibold text-stone-950 dark:text-stone-100">
        Open Links With archive.is
      </p>
      <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
        When enabled, article links open via archive.is.
      </p>

      <div className="mt-3 inline-flex rounded-md border border-stone-300 bg-stone-100/70 p-1 dark:border-stone-700 dark:bg-stone-800/60">
        <button
          type="button"
          onClick={() => setPreference(false)}
          aria-pressed={!openWithArchive}
          className={`cursor-pointer rounded px-3 py-1.5 text-xs font-semibold transition ${
            !openWithArchive
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-200 dark:text-stone-900"
              : "text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
          }`}
        >
          Off
        </button>
        <button
          type="button"
          onClick={() => setPreference(true)}
          aria-pressed={openWithArchive}
          className={`cursor-pointer rounded px-3 py-1.5 text-xs font-semibold transition ${
            openWithArchive
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-700"
              : "text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
          }`}
        >
          On
        </button>
      </div>
      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
        Some links might not work properly with this option turned ON
      </p>
    </div>
  );
}
