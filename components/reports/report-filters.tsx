"use client";

import type { NeedType, ReportStatus } from "@/lib/types";
import { needTypeLabels, statusLabels } from "@/lib/ui/urgency-colors";
import { Select } from "@/components/ui/select";

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
    <div className="flex flex-1 flex-wrap gap-3">
      <Select
        value={type}
        onChange={(v) => onTypeChange(v as NeedType | "all")}
        className="flex-1"
        options={[
          { value: "all", label: "All types" },
          ...NEED_TYPES.map((t) => ({ value: t, label: needTypeLabels[t] })),
        ]}
      />

      <Select
        value={status}
        onChange={(v) => onStatusChange(v as ReportStatus | "all")}
        className="flex-1"
        options={[
          { value: "all", label: "All statuses" },
          ...STATUSES.map((s) => ({ value: s, label: statusLabels[s] })),
        ]}
      />
    </div>
  );
}
