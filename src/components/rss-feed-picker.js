"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide";
import LucideIcon from "@/components/lucide-icon";
import feedCatalog from "@/lib/rss-feed-catalog.json";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function groupFeeds(feeds) {
  const grouped = new Map();

  feeds.forEach((feed) => {
    const groupKey = `${feed.category} / ${feed.country}`;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey).push(feed);
  });

  return Array.from(grouped.entries()).map(([groupLabel, items]) => ({
    groupLabel,
    items,
  }));
}

export function RssFeedPicker({ selectedUrl = "", onSelect, className = "" }) {
  const rootRef = useRef(null);
  const menuId = useId();
  const searchInputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedFeed = useMemo(
    () => feedCatalog.find((feed) => feed.feedLink === selectedUrl),
    [selectedUrl],
  );

  const filteredFeeds = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return feedCatalog;

    return feedCatalog.filter((feed) =>
      [feed.feedName, feed.feedLink, feed.category, feed.country].some((field) =>
        normalizeText(field).includes(normalizedQuery),
      ),
    );
  }, [query]);

  const groupedFeeds = useMemo(() => groupFeeds(filteredFeeds), [filteredFeeds]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleDocumentClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="dialog"
        className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-stone-800"
      >
        <span className="min-w-0 truncate">
          {selectedFeed ? selectedFeed.feedName : "Select Preset Feed"}
        </span>
        <LucideIcon icon={ChevronDown} size={14} className={isOpen ? "rotate-180" : ""} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          className="absolute left-0 z-30 mt-2 w-[min(300px,calc(100vw-3rem))] rounded-lg border border-stone-300 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900"
        >
          <div className="border-b border-stone-200 p-2.5 dark:border-stone-700">
            <div className="flex items-center gap-2 rounded-md border border-stone-300 bg-white px-2.5 py-2 dark:border-stone-700 dark:bg-stone-900">
              <LucideIcon icon={Search} size={14} className="text-stone-500 dark:text-stone-300" />
              <label htmlFor={searchInputId} className="sr-only">
                Search preset feeds
              </label>
              <input
                id={searchInputId}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by feed, category, country, or URL"
                className="w-full bg-transparent text-xs text-stone-900 outline-none dark:text-stone-100 dark:placeholder:text-stone-300"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2.5">
            {groupedFeeds.length === 0 ? (
              <p className="rounded-md bg-stone-100 px-2.5 py-2 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                No feeds match your search.
              </p>
            ) : (
              groupedFeeds.map((group) => (
                <div key={group.groupLabel} className="mb-4 last:mb-0">
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-stone-300">
                    {group.groupLabel}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((feed) => (
                      <li key={feed.feedLink}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(feed.feedLink);
                            setQuery("");
                            setIsOpen(false);
                          }}
                          className={`cursor-pointer flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition ${
                            selectedUrl === feed.feedLink
                              ? "border-sky-400 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/45"
                              : "border-stone-200 bg-stone-50 hover:bg-stone-100 hover:text-blue-500 dark:border-stone-700 dark:bg-stone-800/70 dark:hover:bg-stone-700 dark:hover:text-sky-300"
                          }`}
                        >
                          <span className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="text-xs font-semibold truncate dark:text-stone-100">
                              {feed.feedName}
                            </span>
                            <span className="text-[11px] truncate flex-1 dark:text-stone-300">
                              {feed.feedLink}
                            </span>
                          </span>
                          {selectedUrl === feed.feedLink ? (
                            <span className="text-sky-700 shrink-0 dark:text-sky-300">
                              <LucideIcon icon={Check} size={14} />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
