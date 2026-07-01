import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";
import { Task, AuditLog } from "./types";

/**
 * Mark a claimed task as resolved.
 * Only the responder who claimed the task (or an LGU) may resolve it.
 */
export const resolveTask = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { taskId, notes } = request.data as {
    taskId: string;
    notes?: string;
  };
  if (!taskId || typeof taskId !== "string") {
    throw new HttpsError("invalid-argument", "taskId is required.");
  }

  const uid = request.auth.uid;
  const taskRef = db.doc(`tasks/${taskId}`);
  const auditRef = db.collection("audit").doc();

  // Check caller role
  const userSnap = await db.doc(`users/${uid}`).get();
  const callerRole = userSnap.data()?.role as string | undefined;
  const isLGU = callerRole === "lgu";

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(taskRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Task not found.");
    }

    const task = snap.data() as Task;
    if (task.status !== "claimed") {
      throw new HttpsError(
        "failed-precondition",
        `Task must be claimed before it can be resolved (current: ${task.status}).`
      );
    }

    if (!isLGU && task.claimedBy !== uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the assigned responder or LGU can resolve this task."
      );
    }

    tx.update(taskRef, {
      status: "resolved",
      updatedAt: FieldValue.serverTimestamp(),
      ...(notes ? { resolutionNotes: notes } : {}),
    });

    const auditEntry: Omit<AuditLog, "timestamp"> = {
      taskId,
      action: "resolved",
      performedBy: uid,
      previousStatus: "claimed",
    };
    tx.set(auditRef, {
      ...auditEntry,
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});
