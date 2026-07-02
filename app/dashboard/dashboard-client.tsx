"use client";

/**
 * dashboard-client.tsx
 *
 * Provides both a list view and a Kanban dispatch board.
 * Toggle between them with the view-switcher buttons.
 *
 * Real-time sync strategy:
 *   - When Firebase credentials are configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *     is set) and the user is signed in, we subscribe to a Firestore onSnapshot
 *     listener on the tasks collection. This gives true real-time updates.
 *   - When credentials are absent (demo / local dev without Firebase) we fall
 *     back to the existing 9-second polling approach via refetchReportsAction.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { NeedType, Report, ReportStatus } from "@/lib/types";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportList } from "@/components/reports/report-list";
import { KanbanBoard } from "@/components/reports/kanban-board";
import { ClaimPanel } from "@/components/reports/claim-panel";
import { useResponderName } from "@/lib/use-responder-name";
import { useAuth } from "@/lib/auth-context";
import { refetchReportsAction } from "@/app/dashboard/actions";
import { db } from "@/lib/firebase";

const DisasterMap = dynamic(
  () => import("@/components/map/disaster-map").then((m) => m.DisasterMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100" /> }
);

const POLL_INTERVAL_MS = 9000;
const HAS_FIREBASE_CONFIG = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

type ViewMode = "list" | "kanban";

/** Convert a Firestore task document to the frontend Report shape. */
function taskDocToReport(id: string, data: Record<string, unknown>): Report {
  return {
    id,
    type: (data.type as Report["type"]) ?? "other",
    location: {
      lat: (data.location as { latitude: number })?.latitude ?? 0,
      lng: (data.location as { longitude: number })?.longitude ?? 0,
    },
    area: (data.area as string) ?? "",
    description: (data.description as string) ?? "",
    urgency: (data.urgency as Report["urgency"]) ?? "medium",
    status: (data.status as ReportStatus) ?? "open",
    claimedBy: (data.claimedBy as string | undefined) ?? undefined,
    contactInfo: (data.contactInfo as string | undefined) ?? undefined,
    createdAt:
      typeof data.createdAt === "object" && data.createdAt !== null
        ? (data.createdAt as { toDate(): Date }).toDate().toISOString()
        : String(data.createdAt ?? ""),
    updatedAt:
      typeof data.updatedAt === "object" && data.updatedAt !== null
        ? (data.updatedAt as { toDate(): Date }).toDate().toISOString()
        : String(data.updatedAt ?? ""),
  };
}

export function DashboardClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [type, setType] = useState<NeedType | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const { name, setName } = useResponderName();
  const { user } = useAuth();

  useEffect(() => {
    // Real-time path: Firestore onSnapshot when signed in + Firebase configured
    if (HAS_FIREBASE_CONFIG && user) {
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snap) => {
        const updated: Report[] = snap.docs.map((doc) =>
          taskDocToReport(doc.id, doc.data() as Record<string, unknown>)
        );
        setReports(updated);
      });
      return unsubscribe;
    }

    // Polling fallback: no Firebase creds or not signed in
    const interval = setInterval(async () => {
      const latest = await refetchReportsAction();
      setReports(latest);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
  }, [reports, type, status]);

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  function handleUpdated(updated: Report) {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top controls */}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-slate-500">Your name (responder)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Responder Team 3"
          className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      {/* Map */}
      <div className="h-[400px] overflow-hidden rounded-lg border border-slate-300">
        <DisasterMap reports={filtered} onSelectReport={setSelectedReportId} />
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <ReportFilters
          type={type}
          status={status}
          onTypeChange={setType}
          onStatusChange={setStatus}
        />

        {/* View toggle */}
        <div className="flex h-9 rounded-md border border-slate-300 overflow-hidden text-sm">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 font-medium ${view === "kanban" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Board
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 font-medium ${view === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Board/list */}
      <div className="flex flex-col">
        {view === "kanban" ? (
          <KanbanBoard reports={filtered} onManage={setSelectedReportId} />
        ) : (
          <ReportList reports={filtered} onManage={setSelectedReportId} />
        )}
      </div>

      {selectedReport && (
        <ClaimPanel
          report={selectedReport}
          responderName={name}
          onClose={() => setSelectedReportId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
