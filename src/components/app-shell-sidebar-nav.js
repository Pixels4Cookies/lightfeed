"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LucideIcon from "@/components/lucide-icon";
import { Home, Newspaper, PlusCircle, Bookmark, Settings } from "lucide";

function normalizePathname(pathname) {
  const safePathname = String(pathname ?? "").trim() || "/";
  if (safePathname !== "/" && safePathname.endsWith("/")) {
    return safePathname.slice(0, -1);
  }
  return safePathname;
}

function isFeedPageActive(pathname, pageId) {
  const pagePath = `/feeds/${pageId}`;
  return pathname === pagePath || pathname === `${pagePath}/edit`;
}

function MenuLink({ href, children, isActive }) {
  const baseClass = "flex items-center gap-2 block rounded-md px-3 py-2 text-sm font-medium text-stone-700 no-underline transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100";
  const activeClass = "bg-stone-200 dark:bg-stone-800";
  const className = isActive ? `${baseClass} ${activeClass}` : baseClass;

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShellSidebarNav({ pages }) {
  const pathname = normalizePathname(usePathname());
  const isFeedsRoute = pathname === "/feeds" || pathname.startsWith("/feeds/");

  return (
    <>
      <nav className="mt-5 space-y-1">
        <MenuLink href="/" isActive={pathname === "/"}>
          <LucideIcon icon={Home} />
          Home
        </MenuLink>
        <MenuLink href="/saved" isActive={pathname === "/saved"}>
          <LucideIcon icon={Bookmark} />
          Saved For Later
        </MenuLink>
        <MenuLink href="/settings" isActive={pathname === "/settings"}>
          <LucideIcon icon={Settings} />
          Settings
        </MenuLink>
      </nav>

      <div className="mt-5">
        <Link 
          href="/feeds/new" 
          className="flex items-center gap-2 bg-stone-900 text-stone-50 h-[48px] w-full rounded-md justify-center no-underline font-bold hover:bg-stone-800 hover:shadow-xl hover:shadow-slate-500/50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300 dark:hover:shadow-stone-900/30"
        >
          <LucideIcon icon={PlusCircle} />
          Create Feed
        </Link>
      </div>

      <div className="mt-6">
        <span className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-300">
          Feeds
        </span>
        <div className="mt-2 space-y-1">
          {(pages ?? []).map((page) => (
            <MenuLink
              key={page.id}
              href={`/feeds/${page.id}`}
              isActive={isFeedPageActive(pathname, page.id)}
            >
              {page.isHomepage ? (
                <LucideIcon icon={Home} size={12} />
              ) : (
                <LucideIcon icon={Newspaper} size={12}/>
              )}
              {page.name}
            </MenuLink>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs text-stone-600 dark:text-stone-300">
        Premium-quality, free forever, and open source.
      </p>

      <hr className="mt-3 mb-2 border-stone-200 dark:border-stone-800" />
      <p className="text-xs text-stone-500 dark:text-stone-300">
        Logos by{" "}
        <a
          href="https://logo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
        >
          logo.dev
        </a>
      </p>
    </>
  );
}
