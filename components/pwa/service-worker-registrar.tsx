"use client";

import { useEffect } from "react";

/** Registers the LIGTAS service worker for offline/PWA support. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {/* sw registration is best-effort */});
    }
  }, []);
  return null;
}
