export function FeedGhostList({
  titleWidthClass = "w-56",
  count = 6,
}) {
  return (
    <section className="mb-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={`h-10 rounded-md bg-stone-200/90 animate-pulse dark:bg-stone-800 ${titleWidthClass}`} />
        <div className="h-6 w-24 rounded-md bg-stone-200/90 animate-pulse dark:bg-stone-800" />
      </div>

      <ul className="mt-4 space-y-8">
        {Array.from({ length: count }).map((_, index) => (
            <li
              key={`ghost-${index}`}
              className="rounded-xl bg-white p-4 shadow-xl shadow-transparent md:p-5 dark:bg-stone-900/80"
            >
              <article className="flex flex-col gap-4 animate-pulse">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-6 w-16 rounded-sm bg-stone-200/90 dark:bg-stone-800" />
                    <div className="h-4 w-32 rounded bg-stone-200/90 dark:bg-stone-800" />
                  </div>
                  <div className="h-4 w-20 rounded bg-stone-200/90 dark:bg-stone-800" />
                </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="h-8 w-full max-w-2xl rounded bg-stone-200/90 dark:bg-stone-800" />
                  <div className="h-4 w-full rounded bg-stone-200/90 dark:bg-stone-800" />
                  <div className="h-4 w-11/12 rounded bg-stone-200/90 dark:bg-stone-800" />
                </div>
                <div className="aspect-[16/10] w-full rounded-md bg-stone-200/90 dark:bg-stone-800 lg:max-w-[240px]" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
                <div className="h-3 w-56 rounded bg-stone-200/90 dark:bg-stone-800" />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-8 w-24 rounded-md bg-stone-200/90 dark:bg-stone-800" />
                  <div className="h-8 w-28 rounded-md bg-stone-200/90 dark:bg-stone-800" />
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
