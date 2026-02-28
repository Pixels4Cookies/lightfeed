import Link from "next/link";
import { version } from "@/../package.json";
import { listPages } from "@/lib/lightfeed-data";
import { AppShellMobileNav } from "@/components/app-shell-mobile-nav";
import { AppShellSidebarNav } from "@/components/app-shell-sidebar-nav";
import Logo from "@/app/assets/logo";

export function AppShell({ children }) {
  const pages = listPages();

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1180px] p-4">
        <AppShellMobileNav pages={pages} />

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden h-fit p-4 lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <div className="flex flex-col">
              <Link
                href="/"
                aria-label="LightFeed home"
                className="text-2xl font-semibold tracking-tight text-stone-950 no-underline dark:text-stone-100"
              >
                <Logo />
              </Link>
            </div>

            <AppShellSidebarNav pages={pages} />
            <div className="flex flex-col mt-4 space-y-2">
              <small className="text-xs text-stone-600 dark:text-stone-400">
                <a 
                  href="https://github.com/Pixels4Cookies/lightfeed" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 dark:hover:text-stone-200 underline"
                >
                  View source on GitHub
                </a>
              </small>
              <small className="text-[10px] text-stone-500 font-mono dark:text-stone-300">
                v{version}
              </small>
            </div>
          </aside>

          <main className="flex min-w-0 flex-col pt-5 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
