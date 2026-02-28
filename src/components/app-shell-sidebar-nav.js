"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LucideIcon from "@/components/lucide-icon";
import {
  Home,
  Newspaper,
  PlusCircle,
  Bookmark,
  Settings,
  GripVertical,
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

function movePageToTarget(pages, sourceId, targetId) {
  const sourceIndex = pages.findIndex((page) => page.id === sourceId);
  const targetIndex = pages.findIndex((page) => page.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return pages;
  }

  const nextPages = [...pages];
  const [movedPage] = nextPages.splice(sourceIndex, 1);
  nextPages.splice(targetIndex, 0, movedPage);

  return nextPages;
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
  const [orderedPages, setOrderedPages] = useState(() => pages ?? []);
  const [reorderState, setReorderState] = useState({
    saving: false,
    error: "",
  });
  const [dragState, setDragState] = useState({
    sourceId: "",
    targetId: "",
  });

  useEffect(() => {
    setOrderedPages(pages ?? []);
  }, [pages]);

  const persistPageOrder = async (nextPages, previousPages) => {
    setOrderedPages(nextPages);
    setReorderState({
      saving: true,
      error: "",
    });

    try {
      const response = await fetch("/api/feeds", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIds: nextPages.map((page) => page.id),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save feed order.");
      }

      setOrderedPages(Array.isArray(payload?.data) ? payload.data : nextPages);
      setReorderState({
        saving: false,
        error: "",
      });
    } catch (error) {
      setOrderedPages(previousPages);
      setReorderState({
        saving: false,
        error: error instanceof Error ? error.message : "Unable to save feed order.",
      });
    }
  };

  const handleDragStart = (event, pageId) => {
    if (reorderState.saving || orderedPages.length < 2) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pageId);

    setDragState({
      sourceId: pageId,
      targetId: pageId,
    });
  };

  const handleDragOver = (event, pageId) => {
    if (!dragState.sourceId || reorderState.saving) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dragState.targetId !== pageId) {
      setDragState((current) => ({
        ...current,
        targetId: pageId,
      }));
    }
  };

  const handleDrop = async (event, targetId) => {
    event.preventDefault();

    const sourceId = dragState.sourceId;

    setDragState({
      sourceId: "",
      targetId: "",
    });

    if (!sourceId || sourceId === targetId || reorderState.saving) {
      return;
    }

    const previousPages = orderedPages;
    const nextPages = movePageToTarget(previousPages, sourceId, targetId);

    if (nextPages === previousPages) {
      return;
    }

    await persistPageOrder(nextPages, previousPages);
  };

  const handleDragEnd = () => {
    setDragState({
      sourceId: "",
      targetId: "",
    });
  };

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
          {orderedPages.map((page) => (
            <div
              key={page.id}
              draggable={orderedPages.length > 1 && !reorderState.saving}
              onDragStart={(event) => handleDragStart(event, page.id)}
              onDragOver={(event) => handleDragOver(event, page.id)}
              onDrop={(event) => {
                void handleDrop(event, page.id);
              }}
              onDragEnd={handleDragEnd}
              className={[
                "rounded-md transition group",
                dragState.targetId === page.id && dragState.sourceId !== page.id
                  ? "bg-sky-100/70 dark:bg-sky-900/30"
                  : "",
                dragState.sourceId === page.id ? "opacity-70" : "",
              ].join(" ")}
            >
              <MenuLink
                href={`/feeds/${page.id}`}
                isActive={isFeedPageActive(pathname, page.id)}
              >
                {page.isHomepage ? (
                  <LucideIcon icon={Home} size={12} />
                ) : (
                  <LucideIcon icon={Newspaper} size={12} />
                )}
                <span className="flex-1 truncate">{page.name}</span>
                <LucideIcon
                  icon={GripVertical}
                  size={12}
                  className="hidden group-hover:block cursor-grab text-stone-400 dark:text-stone-500"
                />
              </MenuLink>
            </div>
          ))}
        </div>
        {reorderState.error ? (
          <p className="mt-2 px-3 text-xs text-rose-700 dark:text-rose-300">
            {reorderState.error}
          </p>
        ) : null}
        {reorderState.saving ? (
          <p className="mt-2 px-3 text-xs text-stone-600 dark:text-stone-400">
            Saving order...
          </p>
        ) : null}
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
