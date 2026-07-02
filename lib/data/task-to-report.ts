import type { Report, ReportStatus } from "@/lib/types";

/** Convert a Firestore `tasks/{id}` document to the frontend Report shape. */
export function taskDocToReport(id: string, data: Record<string, unknown>): Report {
  return {
    id,
    // Prefer the original frontend NeedType (needType) when present — the
    // backend `type` field is the narrower TaskType vocabulary (rescue/
    // supply/medical) and isn't 1:1 invertible back to food/evacuation/etc.
    type: (data.needType as Report["type"]) ?? (data.type as Report["type"]) ?? "other",
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
    reportedBy: (data.reportedBy as string | undefined) ?? undefined,
    reportedByName: (data.reportedByName as string | undefined) ?? undefined,
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
