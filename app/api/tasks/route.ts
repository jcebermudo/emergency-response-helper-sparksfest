/**
 * POST /api/tasks
 * Body: { type, location: { lat, lng }, description }
 *
 * Creates a new open task reported by the authenticated user.
 * Requires Authorization: Bearer <firebase-id-token> header.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, GeoPoint } from "firebase-admin/firestore";
import { db, auth, isCredentialError } from "@/lib/firebase-admin";
import { NeedType, TaskType, UrgencyLevel } from "@/lib/types";

const VALID_TYPES: TaskType[] = ["rescue", "supply", "medical"];
const VALID_NEED_TYPES: NeedType[] = ["food", "medical", "evacuation", "other"];
const VALID_URGENCIES: UrgencyLevel[] = ["low", "medium", "high", "critical"];

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

  // ── Validate body ────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, location, description, area, urgency, needType } = body as {
    type: TaskType;
    location: { lat: number; lng: number };
    description: string;
    area?: string;
    urgency?: UrgencyLevel;
    needType?: NeedType;
  };

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!location?.lat || !location?.lng) {
    return NextResponse.json(
      { error: "location.lat and location.lng are required" },
      { status: 400 }
    );
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (needType !== undefined && !VALID_NEED_TYPES.includes(needType)) {
    return NextResponse.json(
      { error: `needType must be one of: ${VALID_NEED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (urgency !== undefined && !VALID_URGENCIES.includes(urgency)) {
    return NextResponse.json(
      { error: `urgency must be one of: ${VALID_URGENCIES.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Write ────────────────────────────────────────────────────────────────
  // `type` stays the narrower TaskType vocabulary the rest of the backend
  // (Cloud Functions, BigQuery export) already expects. needType/area/urgency
  // are additive fields so the frontend can render the same fidelity as the
  // mock Report shape — see lib/data/task-to-report.ts.
  //
  // reportedByName is resolved here (server-side, Admin SDK bypasses
  // firestore.rules) and snapshotted onto the task, rather than looked up
  // client-side per-viewer — firestore.rules only lets a user read their
  // own users/{uid} doc (or an LGU account), so another citizen's client
  // can't resolve it themselves.
  let reportedByName: string | undefined;
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    reportedByName = userDoc.data()?.displayName as string | undefined;
  } catch {
    // Non-fatal — the task still gets created without a display name.
  }

  let ref: FirebaseFirestore.DocumentReference;
  try {
  ref = await db.collection("tasks").add({
    type,
    ...(needType !== undefined ? { needType } : {}),
    ...(area !== undefined ? { area: area.trim() } : {}),
    ...(urgency !== undefined ? { urgency } : {}),
    ...(reportedByName ? { reportedByName } : {}),
    status: "open",
    location: new GeoPoint(location.lat, location.lng),
    reportedBy: uid,
    claimedBy: null,
    description: description.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  } catch (err) {
    if (isCredentialError(err)) {
      return NextResponse.json({ error: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT in .env.local." }, { status: 503 });
    }
    throw err;
  }

  return NextResponse.json({ success: true, taskId: ref.id }, { status: 201 });
}
