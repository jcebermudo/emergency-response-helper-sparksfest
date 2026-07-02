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
        className="h-9 appearance-none rounded-md border border-slate-300 bg-[right_0.75rem_center] bg-no-repeat bg-[length:0.8rem] pl-3 pr-9 text-sm bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
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
        className="h-9 appearance-none rounded-md border border-slate-300 bg-[right_0.75rem_center] bg-no-repeat bg-[length:0.8rem] pl-3 pr-9 text-sm bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
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
