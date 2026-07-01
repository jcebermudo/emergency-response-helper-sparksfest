import { Timestamp, GeoPoint } from "firebase-admin/firestore";

export type TaskType   = "rescue" | "supply" | "medical";
export type TaskStatus = "open" | "claimed" | "resolved";
export type UserRole   = "citizen" | "desk_officer" | "responder" | "lgu";

export interface Task {
  type: TaskType;
  status: TaskStatus;
  location: GeoPoint;
  reportedBy: string;        // uid
  claimedBy: string | null;  // uid
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolutionNotes?: string;
}

export interface AuditLog {
  taskId: string;
  action: "created" | "claimed" | "resolved";
  performedBy: string; // uid
  timestamp: Timestamp;
  previousStatus: TaskStatus | null;
}

export interface User {
  role: UserRole;
  displayName: string;
}

// Shape streamed to BigQuery
export interface TaskBQRow {
  task_id: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  reported_by: string;
  claimed_by: string | null;
  description: string;
  created_at: string; // ISO string
  updated_at: string;
}
