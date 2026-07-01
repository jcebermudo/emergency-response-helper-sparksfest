/**
 * POST /api/tasks/[id]/claim
 *
 * Atomically claims an open task for the authenticated responder/LGU.
 * Requires Authorization: Bearer <firebase-id-token> header.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db, auth } from "@/lib/firebase-admin";
import { Task } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  // ── Auth ────────────────────────────────────────────────────────────────
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ── Role check ──────────────────────────────────────────────────────────
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.data()?.role as string | undefined;
  if (role !== "responder" && role !== "lgu") {
    return NextResponse.json(
      { error: "Only responders or LGU can claim tasks" },
      { status: 403 }
    );
  }

  // ── Transaction ─────────────────────────────────────────────────────────
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
    if (msg === "NOT_FOUND")
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (msg.startsWith("ALREADY_"))
      return NextResponse.json({ error: `Task is already ${msg.replace("ALREADY_", "").toLowerCase()}` }, { status: 409 });
    throw err;
  }

  return NextResponse.json({ success: true });
}
