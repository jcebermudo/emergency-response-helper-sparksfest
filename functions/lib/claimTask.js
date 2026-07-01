"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimTask = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("./firebase");
/**
 * Atomically claim an open task for the calling responder/LGU.
 * Uses a Firestore transaction to prevent two responders from
 * claiming the same task simultaneously.
 */
exports.claimTask = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { taskId } = request.data;
    if (!taskId || typeof taskId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "taskId is required.");
    }
    const uid = request.auth.uid;
    const taskRef = firebase_1.db.doc(`tasks/${taskId}`);
    const auditRef = firebase_1.db.collection("audit").doc();
    await firebase_1.db.runTransaction(async (tx) => {
        const snap = await tx.get(taskRef);
        if (!snap.exists) {
            throw new https_1.HttpsError("not-found", "Task not found.");
        }
        const task = snap.data();
        if (task.status !== "open") {
            throw new https_1.HttpsError("failed-precondition", `Task is already ${task.status}.`);
        }
        tx.update(taskRef, {
            status: "claimed",
            claimedBy: uid,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const auditEntry = {
            taskId,
            action: "claimed",
            performedBy: uid,
            previousStatus: "open",
        };
        tx.set(auditRef, Object.assign(Object.assign({}, auditEntry), { timestamp: firestore_1.FieldValue.serverTimestamp() }));
    });
    return { success: true };
});
//# sourceMappingURL=claimTask.js.map