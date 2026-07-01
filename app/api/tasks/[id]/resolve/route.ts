/**
 * POST /api/tasks/[id]/resolve
 * Body: { notes?: string }
 *
 * Marks a claimed task as resolved.
 * Only the responder who claimed it, or an LGU, may resolve.
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

  const { notes } = (await request.json().catch(() => ({}))) as { notes?: string };

  // ── Role check ──────────────────────────────────────────────────────────
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.data()?.role as string | undefined;
  const isLGU = role === "lgu";

  // ── Transaction ─────────────────────────────────────────────────────────
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
    if (msg === "NOT_FOUND")
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (msg.startsWith("BAD_STATUS:"))
      return NextResponse.json({ error: `Task must be claimed first (current: ${msg.split(":")[1]})` }, { status: 409 });
    if (msg === "FORBIDDEN")
      return NextResponse.json({ error: "Only the assigned responder or LGU can resolve this task" }, { status: 403 });
    throw err;
  }

  return NextResponse.json({ success: true });
}
