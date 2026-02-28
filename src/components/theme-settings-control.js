"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeSettingsControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border border-stone-900/8 bg-white/70 p-4 dark:border-stone-100/15 dark:bg-stone-900/60">
      <p className="text-sm font-semibold text-stone-950 dark:text-stone-100">
        Appearance
      </p>
      <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
        Choose how LightFeed looks for you.
      </p>

      <div className="mt-3 inline-flex rounded-md border border-stone-300 bg-stone-100/70 p-1 dark:border-stone-700 dark:bg-stone-800/60">
        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={theme === "light"}
          className={`cursor-pointer rounded px-3 py-1.5 text-xs font-semibold transition ${
            theme === "light"
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-200 dark:text-stone-900"
              : "text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={theme === "dark"}
          className={`cursor-pointer rounded px-3 py-1.5 text-xs font-semibold transition ${
            theme === "dark"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-700"
              : "text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
          }`}
        >
          Dark
        </button>
      </div>
    </div>
  );
}
