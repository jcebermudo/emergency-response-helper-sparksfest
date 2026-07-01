"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToBigQuery = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-admin/firestore");
const bigquery_1 = require("@google-cloud/bigquery");
const firebase_1 = require("./firebase");
const DATASET = "emergency_response";
const TABLE = "tasks_history";
const bq = new bigquery_1.BigQuery();
/**
 * Nightly batch: stream all tasks updated in the last 24 hours into BigQuery.
 * Runs at 02:00 Manila time (UTC+8 → 18:00 UTC).
 */
exports.exportToBigQuery = (0, scheduler_1.onSchedule)({
    schedule: "0 18 * * *",
    timeZone: "UTC",
    region: "asia-southeast1",
}, async () => {
    const cutoff = firestore_1.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const snap = await firebase_1.db
        .collection("tasks")
        .where("updatedAt", ">=", cutoff)
        .get();
    if (snap.empty) {
        v2_1.logger.info("exportToBigQuery: no tasks updated in the last 24h");
        return;
    }
    const rows = snap.docs.map((doc) => {
        var _a;
        const d = doc.data();
        return {
            task_id: doc.id,
            type: d.type,
            status: d.status,
            latitude: d.location.latitude,
            longitude: d.location.longitude,
            reported_by: d.reportedBy,
            claimed_by: (_a = d.claimedBy) !== null && _a !== void 0 ? _a : null,
            description: d.description,
            created_at: d.createdAt.toDate().toISOString(),
            updated_at: d.updatedAt.toDate().toISOString(),
        };
    });
    await bq.dataset(DATASET).table(TABLE).insert(rows);
    v2_1.logger.info(`exportToBigQuery: inserted ${rows.length} rows into BQ`);
});
//# sourceMappingURL=exportToBigQuery.js.map