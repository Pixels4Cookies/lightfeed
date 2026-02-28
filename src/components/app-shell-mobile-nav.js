"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/app/assets/logo";
import LucideIcon from "@/components/lucide-icon";
import {
  Bookmark,
  Home,
  Menu,
  Newspaper,
  PlusCircle,
  Settings,
  X,
} from "lucide";

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

function MobileMenuLink({ href, children, isActive, onNavigate }) {
  const baseClass =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-stone-700 no-underline transition hover:bg-stone-200 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100";
  const activeClass = "bg-stone-200 dark:bg-stone-800";
  const className = isActive ? `${baseClass} ${activeClass}` : baseClass;

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShellMobileNav({ pages }) {
  const pathname = normalizePathname(usePathname());
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-900/8 bg-white/70 p-3 dark:border-stone-100/15 dark:bg-stone-900/70">
        <Link
          href="/"
          aria-label="LightFeed home"
          className="text-2xl font-semibold tracking-tight text-stone-950 no-underline dark:text-stone-100"
        >
          <Logo />
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-300 px-3 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <LucideIcon icon={isOpen ? X : Menu} size={14} />
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen ? (
        <div
          id="mobile-nav-menu"
          className="mt-2 rounded-xl border border-stone-900/8 bg-white/85 p-3 dark:border-stone-100/15 dark:bg-stone-900/80"
        >
          <nav className="space-y-1">
            <MobileMenuLink
              href="/"
              isActive={pathname === "/"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Home} />
              Home
            </MobileMenuLink>
            <MobileMenuLink
              href="/saved"
              isActive={pathname === "/saved"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Bookmark} />
              Saved For Later
            </MobileMenuLink>
            <MobileMenuLink
              href="/settings"
              isActive={pathname === "/settings"}
              onNavigate={() => setIsOpen(false)}
            >
              <LucideIcon icon={Settings} />
              Settings
            </MobileMenuLink>
          </nav>

          <div className="mt-3">
            <Link
              href="/feeds/new"
              className="flex h-[44px] items-center justify-center gap-2 rounded-md bg-stone-900 text-sm font-bold text-stone-50 no-underline transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              onClick={() => setIsOpen(false)}
            >
              <LucideIcon icon={PlusCircle} />
              Create Feed
            </Link>
          </div>

          <div className="mt-4">
            <span className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-300">
              Feeds
            </span>
            <div className="mt-2 space-y-1">
              {(pages ?? []).map((page) => (
                <MobileMenuLink
                  key={page.id}
                  href={`/feeds/${page.id}`}
                  isActive={isFeedPageActive(pathname, page.id)}
                  onNavigate={() => setIsOpen(false)}
                >
                  {page.isHomepage ? (
                    <LucideIcon icon={Home} size={12} />
                  ) : (
                    <LucideIcon icon={Newspaper} size={12} />
                  )}
                  {page.name}
                </MobileMenuLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
