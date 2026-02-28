"use client";

import { useState } from "react";
import { NewsCard } from "@/components/news-card";

export function SavedArticlesList({ initialArticles }) {
  const [articles, setArticles] = useState(initialArticles);

  const handleRemoved = (articleLink) => {
    setArticles((previousArticles) =>
      previousArticles.filter((article) => article.link !== articleLink),
    );
  };

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 p-6 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-900/70">
        <p className="text-center text-sm text-stone-700 dark:text-stone-300">
          You have no saved articles yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-8">
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          initialIsSaved
          actionMode="remove-only"
          onRemoved={handleRemoved}
        />
      ))}
    </ul>
  );
}
