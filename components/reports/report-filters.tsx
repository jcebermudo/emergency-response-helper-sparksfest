"use client";

import type { NeedType, ReportStatus } from "@/lib/types";
import { needTypeLabels, statusLabels } from "@/lib/ui/urgency-colors";

const NEED_TYPES: NeedType[] = ["food", "medical", "evacuation", "other"];
const STATUSES: ReportStatus[] = ["open", "claimed", "in_progress", "resolved"];

export function ReportFilters({
  type,
  status,
  onTypeChange,
  onStatusChange,
}: {
  type: NeedType | "all";
  status: ReportStatus | "all";
  onTypeChange: (value: NeedType | "all") => void;
  onStatusChange: (value: ReportStatus | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as NeedType | "all")}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        <option value="all">All types</option>
        {NEED_TYPES.map((t) => (
          <option key={t} value={t}>
            {needTypeLabels[t]}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ReportStatus | "all")}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        <option value="all">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
