/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import LucideIcon from "./lucide-icon";
import { Bookmark, ExternalLink } from "lucide";
import { useArchiveLinksPreference } from "@/components/use-archive-links-preference";

function getButtonVariant({ mode, isSaved }) {
  if (mode === "remove-only") {
    return "secondary";
  }
  if (isSaved) {
    return "secondary";
  }
  return "secondary";
}

function getButtonLabel({ mode, isSaved, isPending }) {
  if (isPending) {
    return mode === "remove-only" ? "Removing..." : "Saving...";
  }

  if (mode === "remove-only") {
    return "Remove from bookmarks";
  }

  return isSaved ? "Remove from bookmarks" : "Bookmark";
}

function toSafeHttpUrl(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function toSafeHostname(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, "");
    return hostname.replace(/^www\./i, "") || null;
  } catch {
    return null;
  }
}

function toLogoDevUrl(domain) {
  if (!domain) return null;

  const token = String(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? "").trim();
  const params = new URLSearchParams({
    size: "96",
    format: "webp",
    fallback: "404",
  });

  if (token) {
    params.set("token", token);
  }

  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params.toString()}`;
}

function isRedditHostname(hostname) {
  const value = String(hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!value) return false;

  return value === "reddit.com" || value.endsWith(".reddit.com");
}

function toRedditSubredditLabelFromUrl(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) return null;

  try {
    const parsed = new URL(safeUrl);
    if (!isRedditHostname(parsed.hostname)) {
      return null;
    }

    const pathParts = parsed.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    const rIndex = pathParts.findIndex((part) => part.toLowerCase() === "r");
    if (rIndex === -1 || !pathParts[rIndex + 1]) {
      return null;
    }

    const subreddit = decodeURIComponent(pathParts[rIndex + 1]).replace(
      /\.rss$/i,
      "",
    );
    if (!subreddit) {
      return null;
    }

    return `r/${subreddit}`;
  } catch {
    return null;
  }
}

function toRedditSubredditLabel({ sourceUrl, link, sourceTitle }) {
  const subredditFromSourceUrl = toRedditSubredditLabelFromUrl(sourceUrl);
  if (subredditFromSourceUrl) {
    return subredditFromSourceUrl;
  }

  const subredditFromLinkUrl = toRedditSubredditLabelFromUrl(link);
  if (subredditFromLinkUrl) {
    return subredditFromLinkUrl;
  }

  if (!isRedditHostname(toSafeHostname(sourceUrl))) {
    return null;
  }

  const match = String(sourceTitle ?? "").match(/\br\/([A-Za-z0-9_+.-]+)/i);
  if (!match) {
    return null;
  }

  return `r/${match[1]}`;
}

function detectMediaType(mediaUrl) {
  if (!mediaUrl) return null;

  const path = mediaUrl.split("?")[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(path)) {
    return "video";
  }

  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(path)) {
    return "image";
  }

  return "image";
}

function toArchiveIsUrl(rawValue) {
  const safeUrl = toSafeHttpUrl(rawValue);
  if (!safeUrl) {
    return rawValue;
  }

  return `https://archive.is/newest/${encodeURIComponent(safeUrl)}`;
}

export function NewsCard({
  article,
  pageContext = null,
  initialIsSaved = false,
  actionMode = "save-toggle",
  onRemoved,
}) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const openWithArchive = useArchiveLinksPreference();
  const sourceDomain = toSafeHostname(article.link) ?? toSafeHostname(article.sourceUrl);
  const sourceLabel = article.sourceTitle || sourceDomain || "Unknown feed";
  const redditSubredditLabel = toRedditSubredditLabel({
    sourceUrl: article.sourceUrl,
    link: article.link,
    sourceTitle: article.sourceTitle,
  });
  const sourceLogoUrl = toLogoDevUrl(sourceDomain);
  const safePreviewMediaUrl = toSafeHttpUrl(article.imageUrl);
  const previewMediaType = detectMediaType(safePreviewMediaUrl);
  const [isSourceLogoVisible, setIsSourceLogoVisible] = useState(
    Boolean(sourceLogoUrl),
  );
  const [isPreviewMediaVisible, setIsPreviewMediaVisible] = useState(
    Boolean(safePreviewMediaUrl),
  );

  const buttonLabel = getButtonLabel({ mode: actionMode, isSaved, isPending });
  const articleHref = useMemo(() => {
    if (!openWithArchive) {
      return article.link;
    }

    return toArchiveIsUrl(article.link);
  }, [openWithArchive, article.link]);
  const imageLinkLabel = article.title ? `Open article: ${article.title}` : "Open article";

  if (isHidden) {
    return null;
  }

  async function handleSaveToggle() {
    if (isPending) return;

    setErrorMessage("");
    setIsPending(true);

    const shouldRemove = actionMode === "remove-only" || isSaved;

    try {
      if (shouldRemove) {
        const response = await fetch("/api/saved-articles", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ link: article.link }),
        });

        if (!response.ok && response.status !== 404) {
          throw new Error("Could not remove article.");
        }

        setIsSaved(false);

        if (actionMode === "remove-only") {
          setIsHidden(true);
          onRemoved?.(article.link);
        }

        return;
      }

      const response = await fetch("/api/saved-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article,
          page: pageContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save article.");
      }

      setIsSaved(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update saved article.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <li className="rounded-xl bg-white p-4 md:p-5 transition-all shadow-xl shadow-transparent hover:shadow-stone-200 dark:bg-stone-900/80 dark:hover:shadow-stone-900/40">
      <article className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <div className="flex min-w-0 items-center gap-3">
            {sourceLogoUrl && isSourceLogoVisible ? (
              <img
                src={sourceLogoUrl}
                alt={sourceLabel}
                title={sourceLabel}
                className="h-6 w-auto rounded-sm object-contain"
                loading="lazy"
                onError={() => setIsSourceLogoVisible(false)}
              />
            ) : (
              <span>{sourceLabel}</span>
            )}
            {redditSubredditLabel ? <span>{redditSubredditLabel}</span> : null}
            {article.publishedLabel ? <span>{article.publishedLabel}</span> : null}
          </div>

        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={articleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-2xl leading-tight font-semibold text-stone-950 hover:text-stone-700 hover:underline dark:text-stone-100 dark:hover:text-stone-300"
            >
              {article.title}
            </Link>

            {article.summary ? (
              <p className="mt-2 font-serif text-base leading-[150%] text-stone-700 dark:text-stone-300">
                {article.summary}
              </p>
            ) : null}
          </div>

          {safePreviewMediaUrl && isPreviewMediaVisible ? (
            previewMediaType === "video" ? (
              <div className="block aspect-[16/10] w-full overflow-hidden rounded-md lg:max-w-[240px]">
                <video
                  controls
                  preload="metadata"
                  className="h-full w-full object-cover"
                  onError={() => setIsPreviewMediaVisible(false)}
                >
                  <source src={safePreviewMediaUrl} />
                </video>
              </div>
            ) : (
              <Link
                href={articleHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={imageLinkLabel}
                className="group/image block aspect-[16/10] w-full overflow-hidden rounded-md no-underline lg:max-w-[240px]"
              >
                <img
                  src={safePreviewMediaUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover saturate-75"
                  onError={() => setIsPreviewMediaVisible(false)}
                />
              </Link>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {actionMode === "remove-only"
              ? "Saved article"
              : "Open the article or bookmark it for later."}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              href={articleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 text-xs"
            >
              <LucideIcon icon={ExternalLink} />
              {openWithArchive ? "Read Via archive.is" : "Read Article"}
            </Button>
            <Button
              onClick={handleSaveToggle}
              disabled={isPending}
              variant={getButtonVariant({ mode: actionMode, isSaved })}
              className="h-8 px-3 text-xs"
            >
              <LucideIcon icon={Bookmark} />
              {buttonLabel}
            </Button>
          </div>
        </div>
      </article>

      {errorMessage ? (
        <Alert tone="error" className="mt-3 text-xs">
          {errorMessage}
        </Alert>
      ) : null}
    </li>
  );
}
