"use client";

/**
 * KanbanBoard — the dispatch board for the dashboard.
 *
 * Shows reports in three columns: Open · In Progress (claimed) · Resolved.
 * Each card is clickable and opens the ClaimPanel, exactly like the list view.
 */

import type { Report, ReportStatus } from "@/lib/types";
import { needTypeLabels, urgencyBadgeClasses } from "@/lib/ui/urgency-colors";

const COLUMNS: { status: ReportStatus | "open" | "active"; label: string; statuses: ReportStatus[]; color: string }[] = [
  {
    status: "open",
    label: "Open",
    statuses: ["open"],
    color: "border-slate-300 bg-slate-50",
  },
  {
    status: "active",
    label: "In Progress",
    statuses: ["claimed", "in_progress"],
    color: "border-indigo-200 bg-indigo-50",
  },
  {
    status: "resolved" as ReportStatus,
    label: "Resolved",
    statuses: ["resolved"],
    color: "border-green-200 bg-green-50",
  },
];

const STATUS_DOT: Record<ReportStatus, string> = {
  open: "bg-slate-400",
  claimed: "bg-purple-500",
  in_progress: "bg-indigo-500",
  resolved: "bg-green-500",
};

function KanbanCard({
  report,
  onManage,
}: {
  report: Report;
  onManage: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onManage(report.id)}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-400 hover:shadow transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {needTypeLabels[report.type]}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${urgencyBadgeClasses[report.urgency]}`}
        >
          {report.urgency}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-900 leading-snug line-clamp-2">
        {report.area}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{report.description}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[report.status]}`} />
        <span className="text-xs text-slate-400 capitalize">{report.status.replace("_", " ")}</span>
        {report.claimedBy && (
          <span className="ml-auto text-xs text-slate-400 truncate">
            {report.claimedBy}
          </span>
        )}
      </div>
    </button>
  );
}

export function KanbanBoard({
  reports,
  onManage,
}: {
  reports: Report[];
  onManage: (reportId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 h-full">
      {COLUMNS.map((col) => {
        const cards = reports.filter((r) =>
          (col.statuses as ReportStatus[]).includes(r.status)
        );
        return (
          <div key={col.label} className="flex flex-col min-h-0">
            <div className={`mb-2 flex items-center justify-between rounded-md border px-3 py-2 ${col.color}`}>
              <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                {cards.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {cards.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-6">No tasks</p>
              ) : (
                cards.map((r) => (
                  <KanbanCard key={r.id} report={r} onManage={onManage} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
