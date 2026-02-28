const toneStyles = {
  neutral: "border-stone-300 bg-stone-50 text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200",
  info: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
  error: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/35 dark:text-rose-200",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-200",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-200",
};

function resolveTone(tone) {
  if (Object.prototype.hasOwnProperty.call(toneStyles, tone)) {
    return tone;
  }
  return "neutral";
}

export function Alert({
  tone = "neutral",
  title,
  children,
  className = "",
  role,
}) {
  const resolvedTone = resolveTone(tone);
  const resolvedRole = role ?? (resolvedTone === "error" ? "alert" : "status");

  return (
    <div
      role={resolvedRole}
      className={`rounded-lg border px-3 py-2 text-sm ${toneStyles[resolvedTone]} ${className}`.trim()}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}
