import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import { BigQuery } from "@google-cloud/bigquery";
import { db } from "./firebase";
import { Task, TaskBQRow } from "./types";

const DATASET = "emergency_response";
const TABLE = "tasks_history";
const bq = new BigQuery();

/**
 * Nightly batch: stream all tasks updated in the last 24 hours into BigQuery.
 * Runs at 02:00 Manila time (UTC+8 → 18:00 UTC).
 */
export const exportToBigQuery = onSchedule(
  {
    schedule: "0 18 * * *",
    timeZone: "UTC",
    region: "asia-southeast1",
  },
  async () => {
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const snap = await db
      .collection("tasks")
      .where("updatedAt", ">=", cutoff)
      .get();

    if (snap.empty) {
      logger.info("exportToBigQuery: no tasks updated in the last 24h");
      return;
    }

    const rows: TaskBQRow[] = snap.docs.map((doc) => {
      const d = doc.data() as Task;
      return {
        task_id: doc.id,
        type: d.type,
        status: d.status,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        reported_by: d.reportedBy,
        claimed_by: d.claimedBy ?? null,
        description: d.description,
        created_at: d.createdAt.toDate().toISOString(),
        updated_at: d.updatedAt.toDate().toISOString(),
      };
    });

    await bq.dataset(DATASET).table(TABLE).insert(rows);
    logger.info(`exportToBigQuery: inserted ${rows.length} rows into BQ`);
  }
);
