/**
 * Shared TypeScript types used by both the Next.js app and Cloud Functions.
 * Keep this free of Firebase SDK imports so it works in any context.
 */

export type TaskType   = "rescue" | "supply" | "medical";
export type TaskStatus = "open" | "claimed" | "resolved";
export type UserRole   = "citizen" | "desk_officer" | "responder" | "lgu";

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
