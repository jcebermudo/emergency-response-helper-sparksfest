import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";
import { Task, AuditLog } from "./types";

/**
 * Atomically claim an open task for the calling responder/LGU.
 * Uses a Firestore transaction to prevent two responders from
 * claiming the same task simultaneously.
 */
export const claimTask = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { taskId } = request.data as { taskId: string };
  if (!taskId || typeof taskId !== "string") {
    throw new HttpsError("invalid-argument", "taskId is required.");
  }

  const uid = request.auth.uid;
  const taskRef = db.doc(`tasks/${taskId}`);
  const auditRef = db.collection("audit").doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(taskRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Task not found.");
    }

    const task = snap.data() as Task;
    if (task.status !== "open") {
      throw new HttpsError(
        "failed-precondition",
        `Task is already ${task.status}.`
      );
    }

    tx.update(taskRef, {
      status: "claimed",
      claimedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const auditEntry: Omit<AuditLog, "timestamp"> = {
      taskId,
      action: "claimed",
      performedBy: uid,
      previousStatus: "open",
    };
    tx.set(auditRef, {
      ...auditEntry,
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});
