"use client";

import { useSyncExternalStore } from "react";
import {
  getArchiveLinksPreferenceServerSnapshot,
  getArchiveLinksPreferenceSnapshot,
  subscribeArchiveLinksPreference,
} from "@/lib/archive-link-preference";

export function useArchiveLinksPreference() {
  return useSyncExternalStore(
    subscribeArchiveLinksPreference,
    getArchiveLinksPreferenceSnapshot,
    getArchiveLinksPreferenceServerSnapshot,
  );
}
