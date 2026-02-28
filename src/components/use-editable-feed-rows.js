"use client";

import { useMemo, useState } from "react";

function makeFeedRow(prefix, seed = 0) {
  return {
    id: `${prefix}-${Date.now()}-${seed}`,
    url: "",
  };
}

export function createInitialFeedRows(prefix, count = 1) {
  const safeCount = Math.max(1, Number(count) || 1);

  return Array.from({ length: safeCount }, (_, index) =>
    makeFeedRow(prefix, index + 1),
  );
}

export function mapFeedMixToEditableRows(feedMix, prefix) {
  if (!Array.isArray(feedMix) || feedMix.length === 0) {
    return createInitialFeedRows(prefix, 1);
  }

  return feedMix.map((feed, index) => ({
    id: `${prefix}-${feed.feedId ?? "feed"}-${index + 1}`,
    url: String(feed.url ?? ""),
  }));
}

export function useEditableFeedRows({ prefix, initialRows }) {
  const [rows, setRows] = useState(() => {
    if (Array.isArray(initialRows) && initialRows.length > 0) {
      return initialRows;
    }

    return createInitialFeedRows(prefix, 1);
  });

  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      makeFeedRow(prefix, currentRows.length + 1),
    ]);
  };

  const removeRow = (rowId) => {
    setRows((currentRows) => {
      if (currentRows.length <= 1) return currentRows;
      return currentRows.filter((row) => row.id !== rowId);
    });
  };

  const updateRow = (rowId, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const resolvedFeeds = useMemo(
    () =>
      rows
        .map((row) => ({
          url: String(row.url ?? "").trim(),
        }))
        .filter((row) => row.url.length > 0),
    [rows],
  );

  const resolveFeeds = () => {
    if (resolvedFeeds.length === 0) {
      throw new Error("Add at least one RSS feed link.");
    }
    return resolvedFeeds;
  };

  return {
    rows,
    addRow,
    removeRow,
    updateRow,
    resolveFeeds,
  };
}
