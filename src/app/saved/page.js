import { AppShell } from "@/components/app-shell";
import { SavedArticlesList } from "@/components/saved-articles-list";
import { listSavedArticles } from "@/lib/saved-articles-db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Saved Articles",
  description: "Articles you bookmarked for later reading.",
};

export default function SavedArticlesPage() {
  const savedArticles = listSavedArticles();

  return (
    <AppShell>
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
            Saved For Later
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-stone-600 dark:text-stone-300">
            {savedArticles.length} saved {savedArticles.length === 1 ? "article" : "articles"}
          </p>
        </div>

        <SavedArticlesList initialArticles={savedArticles} />
      </section>
    </AppShell>
  );
}
