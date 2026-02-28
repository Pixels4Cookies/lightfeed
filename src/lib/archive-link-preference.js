export const ARCHIVE_LINKS_STORAGE_KEY = "lightfeed-open-links-with-archive";
export const ARCHIVE_LINKS_CHANGE_EVENT = "lightfeed-archive-links-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readArchiveLinksPreference() {
  if (!isBrowser()) {
    return false;
  }

  try {
    return localStorage.getItem(ARCHIVE_LINKS_STORAGE_KEY) === "true";
  } catch (_error) {
    return false;
  }
}

export function writeArchiveLinksPreference(nextValue) {
  if (!isBrowser()) {
    return;
  }

  const resolvedValue = Boolean(nextValue);

  try {
    localStorage.setItem(
      ARCHIVE_LINKS_STORAGE_KEY,
      resolvedValue ? "true" : "false",
    );
  } catch (_error) {
    return;
  }

  window.dispatchEvent(new Event(ARCHIVE_LINKS_CHANGE_EVENT));
}

export function subscribeArchiveLinksPreference(callback) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key && event.key !== ARCHIVE_LINKS_STORAGE_KEY) {
      return;
    }
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ARCHIVE_LINKS_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ARCHIVE_LINKS_CHANGE_EVENT, callback);
  };
}

export function getArchiveLinksPreferenceSnapshot() {
  return readArchiveLinksPreference();
}

export function getArchiveLinksPreferenceServerSnapshot() {
  return false;
}
