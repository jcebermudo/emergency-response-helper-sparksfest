"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getDemoUserName } from "@/lib/demo-user";

const STORAGE_KEY = "erh-responder-name";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// Falls back to the port-based fake demo identity (lib/demo-user.ts) instead
// of blank, so the app feels "logged in" without a real auth flow. Still
// overridable — typing a name here persists it and takes over.
function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? getDemoUserName();
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
