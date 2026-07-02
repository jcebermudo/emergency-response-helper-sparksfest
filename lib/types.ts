/**
 * Shared TypeScript types — frontend UI types and backend API types in one place.
 * Keep this free of Firebase SDK imports so it works in any context.
 */

// ── Frontend / UI types ────────────────────────────────────────────────────

export type NeedType     = "food" | "medical" | "evacuation" | "other";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "claimed" | "in_progress" | "resolved";
export type UserRole     = "citizen" | "desk_officer" | "responder" | "lgu";

/** A community-submitted resource request pinned on the map. */
export interface Report {
  id: string;
  type: NeedType;
  location: { lat: number; lng: number };
  area: string;
  description: string;
  urgency: UrgencyLevel;
  status: ReportStatus;
  claimedBy?: string;
  contactInfo?: string;
  /** Fake-login display name of whoever submitted this report (see lib/demo-user.ts). */
  reportedBy?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface NewReportInput {
  type: NeedType;
  location: { lat: number; lng: number };
  area: string;
  description: string;
  urgency: UrgencyLevel;
  contactInfo?: string;
  reportedBy?: string;
}

/** A past resolved incident used to drive the predictive-insights heuristic. */
export interface HistoricalRecord {
  area: string;
  lat: number;
  lng: number;
  type: NeedType;
  timestamp: string; // ISO string
}

export interface PredictedAreaInsight {
  area: string;
  lat: number;
  lng: number;
  score: number;
  dominantNeedType: NeedType;
  sampleSize: number;
}

// ── Backend / Firestore types (used by API routes & Cloud Functions) ────────

/** TaskType mirrors the real Firestore data model (narrower than NeedType). */
export type TaskType   = "rescue" | "supply" | "medical";
export type TaskStatus = "open" | "claimed" | "resolved";

export interface Task {
  type: TaskType;
  status: TaskStatus;
  /** firebase-admin GeoPoint on server; firebase/firestore GeoPoint on client */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any;
  reportedBy: string;
  claimedBy: string | null;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt: any;
  resolutionNotes?: string;
}

export interface User {
  role: UserRole;
  displayName: string;
}
