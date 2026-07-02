"use client";

/**
 * NotificationProvider — pops a toast whenever someone else's report shows
 * up, so it works from any page (mounted once in the root layout), not just
 * the dashboard. Two independent data sources depending on environment:
 *
 *  - Dev: polls the file-backed mock store (lib/data/store.ts, shared
 *    across the separate `next dev` processes each fake-login port runs as,
 *    see lib/demo-user.ts) via refetchReportsAction.
 *  - Production: a Firestore onSnapshot listener on `tasks`, active once a
 *    user is signed in (same gate as dashboard-client.tsx's realtime path).
 *    Reporter display names come from Report.reportedByName, snapshotted
 *    server-side at task-creation time (app/api/tasks/route.ts) — a
 *    client-side users/{uid} lookup won't work here since firestore.rules
 *    only lets a user read their own profile doc (or an LGU account).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { Report } from "@/lib/types";
import { refetchReportsAction } from "@/app/dashboard/actions";
import { useResponderName } from "@/lib/use-responder-name";
import { useAuth } from "@/lib/auth-context";
import { DEMO_MODE } from "@/lib/demo-mode";
import { db, HAS_FIREBASE_CONFIG } from "@/lib/firebase";
import { taskDocToReport } from "@/lib/data/task-to-report";
import { NotificationToast } from "@/components/notifications/notification-toast";

const POLL_INTERVAL_MS = 6000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { name } = useResponderName();
  const { user } = useAuth();
  const router = useRouter();
  const [toasts, setToasts] = useState<Report[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const view = useCallback(
    (id: string) => {
      dismiss(id);
      router.push("/dashboard");
    },
    [dismiss, router]
  );

  // ── Dev path: poll the mock store ──────────────────────────────────────
  useEffect(() => {
    if (!DEMO_MODE) return;
    let cancelled = false;
    // null until the first poll establishes a baseline, so pre-existing
    // reports never fire a notification on load.
    let seenIds: Set<string> | null = null;

    async function poll() {
      const reports = await refetchReportsAction();
      if (cancelled) return;

      if (seenIds === null) {
        seenIds = new Set(reports.map((r) => r.id));
        return;
      }

      const fresh = reports.filter((r) => !seenIds!.has(r.id));
      fresh.forEach((r) => seenIds!.add(r.id));

      const fromOthers = fresh.filter((r) => r.reportedBy && r.reportedBy !== name);
      if (fromOthers.length > 0) {
        setToasts((prev) => [...prev, ...fromOthers]);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [name]);

  // ── Production path: live Firestore listener ───────────────────────────
  useEffect(() => {
    if (DEMO_MODE || !HAS_FIREBASE_CONFIG || !user) return;

    let seenIds: Set<string> | null = null;

    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const reports = snap.docs.map((d) => taskDocToReport(d.id, d.data() as Record<string, unknown>));

      if (seenIds === null) {
        seenIds = new Set(reports.map((r) => r.id));
        return;
      }

      const fresh = reports.filter((r) => !seenIds!.has(r.id));
      fresh.forEach((r) => seenIds!.add(r.id));

      const fromOthers = fresh.filter((r) => r.reportedBy && r.reportedBy !== user.uid);
      if (fromOthers.length > 0) {
        setToasts((prev) => [...prev, ...fromOthers]);
      }
    });

    return unsubscribe;
  }, [user]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[3000] flex flex-col gap-2">
        {toasts.map((report) => (
          <NotificationToast key={report.id} report={report} onDismiss={dismiss} onView={view} />
        ))}
      </div>
    </>
  );
}
