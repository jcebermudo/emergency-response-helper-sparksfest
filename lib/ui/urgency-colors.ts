import type { ReportStatus, UrgencyLevel } from "@/lib/types";

export const urgencyBadgeClasses: Record<UrgencyLevel, string> = {
  low: "bg-blue-100 text-blue-800 border-blue-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

export const urgencyDotColor: Record<UrgencyLevel, string> = {
  low: "#3b82f6",
  medium: "#eab308",
  high: "#f97316",
  critical: "#dc2626",
};

export const statusBadgeClasses: Record<ReportStatus, string> = {
  open: "bg-slate-100 text-slate-800 border-slate-300",
  claimed: "bg-purple-100 text-purple-800 border-purple-300",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
};

export const statusLabels: Record<ReportStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const needTypeLabels: Record<string, string> = {
  food: "Food",
  medical: "Medical",
  evacuation: "Evacuation",
  other: "Other",
};
