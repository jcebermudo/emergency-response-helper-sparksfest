/**
 * POST /api/tasks/[id]/claim
 *
 * Atomically claims an open task for the authenticated responder/LGU.
 * Requires Authorization: Bearer <firebase-id-token> header.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, isCredentialError } from "@/lib/firebase-admin";
import { claimTaskForUser, TaskActionError } from "@/lib/server/tasks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    if (isCredentialError(err)) {
      return NextResponse.json({ error: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT in .env.local." }, { status: 503 });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    await claimTaskForUser(uid, taskId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof TaskActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (isCredentialError(err)) {
      return NextResponse.json({ error: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT in .env.local." }, { status: 503 });
    }
    throw err;
  }
}
