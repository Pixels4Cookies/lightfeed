export function inferFeedTitleFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "");
    return hostname || "Custom Feed";
  } catch {
    return "Custom Feed";
  }
}
