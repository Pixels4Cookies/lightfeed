"use client";

import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { useEffect } from "react";

const themeInitScript = `
  (() => {
    try {
      const storedTheme = localStorage.getItem("lightfeed-theme");
      const theme = storedTheme === "dark" ? "dark" : "light";
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      root.setAttribute("data-theme", theme);
    } catch (_error) {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
`;

export default function GlobalErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(16,185,129,0.2),transparent_36%),linear-gradient(165deg,#f8fafc_0%,#ecfeff_48%,#f8fafc_100%)] text-stone-900 antialiased dark:bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(16,185,129,0.12),transparent_36%),linear-gradient(165deg,#0a0a0a_0%,#111827_48%,#0a0a0a_100%)] dark:text-stone-100">
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <div className="mx-auto max-w-xl">
            <div className="p-6 md:p-8">
              <Alert tone="error" title="Application Error">
                A critical error occurred and the application could not load. Please try again or contact support if the issue persists.
              </Alert>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button onClick={reset}>Try Again</Button>
                <Button href="/" variant="secondary">Go Home</Button>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
