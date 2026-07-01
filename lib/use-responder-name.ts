"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "erh-responder-name";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

// Deliberate prototype simplification: no real auth, just a name the user
// types once, cached in localStorage. Not a security boundary.
export function useResponderName() {
  const name = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setName = useCallback((value: string) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    // storage event only fires in other tabs; dispatch locally to trigger a re-read.
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  return { name, setName };
}
