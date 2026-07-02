/**
 * POST /api/tasks
 * Body: { type, location: { lat, lng }, description, area?, urgency?, needType? }
 *
 * Creates a new open task reported by the authenticated user.
 * Requires Authorization: Bearer <firebase-id-token> header.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, isCredentialError } from "@/lib/firebase-admin";
import { createTaskForUser, TaskActionError } from "@/lib/server/tasks";

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { id } = await createTaskForUser(uid, body);
    return NextResponse.json({ success: true, taskId: id }, { status: 201 });
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
