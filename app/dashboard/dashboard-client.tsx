"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { NeedType, Report, ReportStatus } from "@/lib/types";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportList } from "@/components/reports/report-list";
import { ClaimPanel } from "@/components/reports/claim-panel";
import { useResponderName } from "@/lib/use-responder-name";
import { refetchReportsAction } from "@/app/dashboard/actions";

const DisasterMap = dynamic(
  () => import("@/components/map/disaster-map").then((m) => m.DisasterMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100" /> }
);

const POLL_INTERVAL_MS = 9000;

export function DashboardClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [type, setType] = useState<NeedType | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { name, setName } = useResponderName();

  // STAND-IN for Firebase onSnapshot: polls for reports created/updated by
  // other users and merges them into local state. Replace this effect with a
  // real-time listener subscription when wiring up Firebase; the fetch/merge
  // logic below maps directly onto a snapshot callback.
  useEffect(() => {
    const interval = setInterval(async () => {
      const latest = await refetchReportsAction();
      setReports(latest);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="h-[420px] overflow-hidden rounded-lg border border-slate-300 lg:h-full">
        <DisasterMap reports={filtered} onSelectReport={setSelectedReportId} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Your name (responder)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Responder Team 3"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        <ReportFilters
          type={type}
          status={status}
          onTypeChange={setType}
          onStatusChange={setStatus}
        />

        <div className="flex-1 overflow-y-auto">
          <ReportList reports={filtered} onManage={setSelectedReportId} />
        </div>
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
