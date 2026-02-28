"use client";

import { RssFeedPicker } from "@/components/rss-feed-picker";
import LucideIcon from "./lucide-icon";
import { CircleX } from "lucide";

export function FeedRowsFields({ rows, onUpdateRow, onRemoveRow }) {
  return rows.map((row, index) => {
    const inputId = `feed-row-url-${row.id}`;

    return (
      <div key={row.id} className="flex flex-col lg:flex-row gap-2 lg:items-center">
        <span className="text-xl w-[40px] h-[40px] flex items-center justify-center bg-stone-100 rounded-md shrink-0 dark:bg-stone-800 dark:text-stone-200">
          {index + 1}
        </span>
        <label htmlFor={inputId} className="sr-only">
          Feed URL {index + 1}
        </label>
        <input
          id={inputId}
          type="url"
          value={row.url}
          onChange={(event) => onUpdateRow(row.id, "url", event.target.value)}
          placeholder="https://example.com/feed.xml"
          className="h-10 w-full lg:flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-0 focus:border-sky-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-300"
        />
        <RssFeedPicker
          className="w-full lg:w-[200px]"
          selectedUrl={row.url}
          onSelect={(feedUrl) => onUpdateRow(row.id, "url", feedUrl)}
        />

        <div className="flex lg:items-end">
          <button
            type="button"
            aria-label={`Remove feed source ${index + 1}`}
            className="cursor-pointer flex items-center justify-center w-full lg:w-[40px] h-[40px] bg-red-50 rounded-md text-red-500 transition-colors hover:bg-red-500 hover:text-white dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-700"
            onClick={() => onRemoveRow(row.id)}
            disabled={rows.length === 1}
          >
            <LucideIcon icon={CircleX} />
          </button>
        </div>
      </div>
    );
  });
}
