/**
 * Shared Firestore task logic (server-only — Admin SDK).
 *
 * Both the /api/tasks/* route handlers (external API consumers) and the
 * Server Actions in app/report/actions.ts and app/dashboard/actions.ts call
 * these directly, in-process. Server Actions used to reach the API routes
 * via an internal HTTP self-fetch (fetch(getBaseUrl() + "/api/tasks", ...))
 * — fragile on serverless platforms in ways that are hard to diagnose
 * remotely (ECONNREFUSED to a placeholder base URL, a deployment-protection
 * wall returning 200 for a request that never reached the handler, etc.).
 * Calling the same logic directly removes that whole class of failure.
 */
import { FieldValue, GeoPoint } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import type { NeedType, Task, TaskType, UrgencyLevel } from "@/lib/types";

export class TaskActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const VALID_TYPES: TaskType[] = ["rescue", "supply", "medical"];
const VALID_NEED_TYPES: NeedType[] = ["food", "medical", "evacuation", "other"];
const VALID_URGENCIES: UrgencyLevel[] = ["low", "medium", "high", "critical"];

export interface CreateTaskInput {
  type: TaskType;
  location: { lat: number; lng: number };
  description: string;
  area?: string;
  urgency?: UrgencyLevel;
  needType?: NeedType;
}

export async function createTaskForUser(
  uid: string,
  input: CreateTaskInput
): Promise<{ id: string }> {
  const { type, location, description, area, urgency, needType } = input;

  if (!VALID_TYPES.includes(type)) {
    throw new TaskActionError(`type must be one of: ${VALID_TYPES.join(", ")}`, 400);
  }
  if (!location?.lat || !location?.lng) {
    throw new TaskActionError("location.lat and location.lng are required", 400);
  }
  if (!description?.trim()) {
    throw new TaskActionError("description is required", 400);
  }
  if (needType !== undefined && !VALID_NEED_TYPES.includes(needType)) {
    throw new TaskActionError(`needType must be one of: ${VALID_NEED_TYPES.join(", ")}`, 400);
  }
  if (urgency !== undefined && !VALID_URGENCIES.includes(urgency)) {
    throw new TaskActionError(`urgency must be one of: ${VALID_URGENCIES.join(", ")}`, 400);
  }

  // Snapshotted server-side (Admin SDK bypasses firestore.rules) since a
  // client can only read its own users/{uid} doc — see notification-provider.tsx.
  let reportedByName: string | undefined;
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    reportedByName = userDoc.data()?.displayName as string | undefined;
  } catch {
    // Non-fatal — the task still gets created without a display name.
  }

  const ref = await db.collection("tasks").add({
    type,
    ...(needType !== undefined ? { needType } : {}),
    ...(area !== undefined ? { area: area.trim() } : {}),
    ...(urgency !== undefined ? { urgency } : {}),
    ...(reportedByName ? { reportedByName } : {}),
    status: "open",
    location: new GeoPoint(location.lat, location.lng),
    reportedBy: uid,
    claimedBy: null,
    description: description.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: ref.id };
}

export async function claimTaskForUser(uid: string, taskId: string): Promise<void> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.data()?.role as string | undefined;
  if (role !== "responder" && role !== "lgu") {
    throw new TaskActionError("Only responders or LGU can claim tasks", 403);
  }

  const taskRef = db.doc(`tasks/${taskId}`);
  const auditRef = db.collection("audit").doc();

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(taskRef);
      if (!snap.exists) throw new Error("NOT_FOUND");

      const task = snap.data() as Task;
      if (task.status !== "open") throw new Error(`ALREADY_${task.status.toUpperCase()}`);

      tx.update(taskRef, {
        status: "claimed",
        claimedBy: uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(auditRef, {
        taskId,
        action: "claimed",
        performedBy: uid,
        previousStatus: "open",
        timestamp: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") throw new TaskActionError("Task not found", 404);
    if (msg.startsWith("ALREADY_")) {
      throw new TaskActionError(`Task is already ${msg.replace("ALREADY_", "").toLowerCase()}`, 409);
    }
    throw err;
  }
}

export async function resolveTaskForUser(
  uid: string,
  taskId: string,
  notes?: string
): Promise<void> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.data()?.role as string | undefined;
  const isLGU = role === "lgu";

  const taskRef = db.doc(`tasks/${taskId}`);
  const auditRef = db.collection("audit").doc();

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(taskRef);
      if (!snap.exists) throw new Error("NOT_FOUND");

      const task = snap.data() as Task;
      if (task.status !== "claimed") throw new Error(`BAD_STATUS:${task.status}`);
      if (!isLGU && task.claimedBy !== uid) throw new Error("FORBIDDEN");

      tx.update(taskRef, {
        status: "resolved",
        updatedAt: FieldValue.serverTimestamp(),
        ...(notes ? { resolutionNotes: notes } : {}),
      });
      tx.set(auditRef, {
        taskId,
        action: "resolved",
        performedBy: uid,
        previousStatus: "claimed",
        timestamp: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") throw new TaskActionError("Task not found", 404);
    if (msg.startsWith("BAD_STATUS:")) {
      throw new TaskActionError(`Task must be claimed first (current: ${msg.split(":")[1]})`, 409);
    }
    if (msg === "FORBIDDEN") {
      throw new TaskActionError("Only the assigned responder or LGU can resolve this task", 403);
    }
    throw err;
  }
}
