"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTask = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("./firebase");
/**
 * Mark a claimed task as resolved.
 * Only the responder who claimed the task (or an LGU) may resolve it.
 */
exports.resolveTask = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { taskId, notes } = request.data;
    if (!taskId || typeof taskId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "taskId is required.");
    }
    const uid = request.auth.uid;
    const taskRef = firebase_1.db.doc(`tasks/${taskId}`);
    const auditRef = firebase_1.db.collection("audit").doc();
    // Check caller role
    const userSnap = await firebase_1.db.doc(`users/${uid}`).get();
    const callerRole = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.role;
    const isLGU = callerRole === "lgu";
    await firebase_1.db.runTransaction(async (tx) => {
        const snap = await tx.get(taskRef);
        if (!snap.exists) {
            throw new https_1.HttpsError("not-found", "Task not found.");
        }
        const task = snap.data();
        if (task.status !== "claimed") {
            throw new https_1.HttpsError("failed-precondition", `Task must be claimed before it can be resolved (current: ${task.status}).`);
        }
        if (!isLGU && task.claimedBy !== uid) {
            throw new https_1.HttpsError("permission-denied", "Only the assigned responder or LGU can resolve this task.");
        }
        tx.update(taskRef, Object.assign({ status: "resolved", updatedAt: firestore_1.FieldValue.serverTimestamp() }, (notes ? { resolutionNotes: notes } : {})));
        const auditEntry = {
            taskId,
            action: "resolved",
            performedBy: uid,
            previousStatus: "claimed",
        };
        tx.set(auditRef, Object.assign(Object.assign({}, auditEntry), { timestamp: firestore_1.FieldValue.serverTimestamp() }));
    });
    return { success: true };
});
//# sourceMappingURL=resolveTask.js.map