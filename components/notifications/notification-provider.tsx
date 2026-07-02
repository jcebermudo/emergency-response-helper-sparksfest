"use client";

/**
 * NotificationProvider — polls the shared mock store (lib/data/store.ts,
 * file-backed so it's visible across the separate `next dev` processes each
 * fake-login port runs as, see lib/demo-user.ts) and pops a toast whenever
 * someone else's report shows up. Mounted once in the root layout so it
 * works from any page, not just the dashboard.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/types";
import { refetchReportsAction } from "@/app/dashboard/actions";
import { useResponderName } from "@/lib/use-responder-name";
import { NotificationToast } from "@/components/notifications/notification-toast";

const POLL_INTERVAL_MS = 6000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { name } = useResponderName();
  const router = useRouter();
  const [toasts, setToasts] = useState<Report[]>([]);
  // null until the first poll establishes a baseline, so pre-existing
  // reports never fire a notification on load.
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const reports = await refetchReportsAction();
      if (cancelled) return;

      if (seenIds.current === null) {
        seenIds.current = new Set(reports.map((r) => r.id));
        return;
      }

      const fresh = reports.filter((r) => !seenIds.current!.has(r.id));
      fresh.forEach((r) => seenIds.current!.add(r.id));

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
