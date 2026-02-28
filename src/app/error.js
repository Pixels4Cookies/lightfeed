"use client";

import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { useEffect } from "react";

export default function RootErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(16,185,129,0.2),transparent_36%),linear-gradient(165deg,#f8fafc_0%,#ecfeff_48%,#f8fafc_100%)] text-stone-900 antialiased dark:bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(16,185,129,0.12),transparent_36%),linear-gradient(165deg,#0a0a0a_0%,#111827_48%,#0a0a0a_100%)] dark:text-stone-100">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-xl">
          <div className="p-6 md:p-8">
            <Alert
              tone="error"
              title="Something went wrong"
            >
              <p>An error occurred while loading this page.</p>
              <p className="mt-2">
                We encountered an unexpected issue. You can try again or return home.
              </p>
            </Alert>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button onClick={reset}>Try Again</Button>
              <Button href="/" variant="secondary">Go Home</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
