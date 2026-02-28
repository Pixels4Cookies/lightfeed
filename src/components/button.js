"use client";

import Link from "next/link";
import LucideIcon from "./lucide-icon";

const baseStyles =
  "cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold tracking-[0.03em] transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 dark:focus-visible:ring-stone-300 dark:focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";

const variants = {
  primary:
    "border-stone-900 bg-stone-900 text-stone-50 hover:bg-stone-800 hover:border-stone-800 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:hover:border-stone-300 dark:hover:bg-stone-300",
  secondary:
    "border-stone-400 bg-transparent text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800",
  ghost:
    "border-transparent bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
  link: "border-transparent bg-transparent text-sky-600 hover:text-sky-700 hover:underline underline-offset-2",
  danger:
    "border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700",
};

function getButtonClasses(variant) {
  return `${baseStyles} ${variants[variant] || variants.primary}`;
}

export function Button({
  href,
  variant = "primary",
  disabled = false,
  className = "",
  icon,
  children,
  ...props
}) {
  const classes = `${getButtonClasses(variant)} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {icon && <LucideIcon icon={icon} size={16} />}
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled} {...props}>
      {icon && <LucideIcon icon={icon} size={16} />}
      {children}
    </button>
  );
}
