/**
 * Typed client-side wrappers for the Next.js API routes.
 * Import these in React components instead of calling fetch directly.
 *
 * All mutating calls require the user to be signed in — the Firebase ID token
 * is automatically attached from `auth.currentUser`.
 */
import { auth } from "./firebase";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
}

async function apiFetch<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
  return data as T;
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  type: "rescue" | "supply" | "medical";
  location: { lat: number; lng: number };
  description: string;
}

export const createTask = (input: CreateTaskInput) =>
  apiFetch<{ success: boolean; taskId: string }>("/api/tasks", input);

export const claimTask = (taskId: string) =>
  apiFetch<{ success: boolean }>(`/api/tasks/${taskId}/claim`);

export const resolveTask = (taskId: string, notes?: string) =>
  apiFetch<{ success: boolean }>(`/api/tasks/${taskId}/resolve`, { notes });

// ── Nearby tasks (GET, no auth required) ──────────────────────────────────

export interface NearbyTask {
  id: string;
  type: string;
  status: string;
  location: { lat: number; lng: number };
  reportedBy: string;
  claimedBy: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNearbyTasks(
  lat: number,
  lng: number,
  radiusKm = 5,
  status = "open"
): Promise<NearbyTask[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusKm: String(radiusKm),
    status,
  });
  const res = await fetch(`/api/tasks/nearby?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch tasks");
  return data.tasks as NearbyTask[];
}
