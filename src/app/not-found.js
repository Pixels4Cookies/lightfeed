import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { pillControlClass } from "@/lib/ui-classes";

export const metadata = {
  title: "Not Found",
  description: "The requested page could not be found.",
};

export default function NotFoundPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
          Feed not found
        </h1>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
          The requested route or feed configuration does not exist.
        </p>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          Check the URL, or return to your configured feeds.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/" className={pillControlClass}>
            Go Home
          </Link>
          <Link href="/feeds" className={pillControlClass}>
            View Feeds
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
