"use client";

/**
 * ReportForm — wraps createReportAction and injects the Firebase ID token
 * as a hidden form field (__idToken) so the Server Action can forward it to
 * the real POST /api/tasks endpoint when the user is signed in.
 */

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState } from "react";
import type { NeedType, UrgencyLevel } from "@/lib/types";
import { createReportAction, type CreateReportState } from "@/app/report/actions";
import { useAuth } from "@/lib/auth-context";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100" /> }
);

const NEED_TYPES: NeedType[] = ["food", "medical", "evacuation", "other"];
const URGENCY_LEVELS: UrgencyLevel[] = ["low", "medium", "high", "critical"];

const initialState: CreateReportState = { status: "idle" };

export function ReportForm() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [state, formAction, pending] = useActionState(createReportAction, initialState);
  const { user, getToken } = useAuth();
  const [idToken, setIdToken] = useState("");

  // Refresh the ID token whenever the signed-in user changes
  useEffect(() => {
    if (!user) { setIdToken(""); return; }
    getToken()
      .then(setIdToken)
      .catch(() => setIdToken(""));
  }, [user, getToken]);

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Need type</label>
          <select
            name="type"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {NEED_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Urgency</label>
          <select
            name="urgency"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Area / barangay</label>
          <input
            type="text"
            name="area"
            required
            placeholder="e.g. Barangka, Marikina City"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="What's needed and how many people are affected?"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Contact info (optional)
          </label>
          <input
            type="text"
            name="contactInfo"
            placeholder="Phone number or messaging handle"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Hidden fields — location coords + Firebase ID token */}
        <input type="hidden" name="lat" value={location?.lat ?? ""} />
        <input type="hidden" name="lng" value={location?.lng ?? ""} />
        <input type="hidden" name="__idToken" value={idToken} />

        {state.status === "error" && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}
        {state.status === "success" && (
          <p className="text-sm text-green-600">Report submitted. Thank you.</p>
        )}

        <button
          type="submit"
          disabled={pending || !location}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit Report"}
        </button>
        {!location && (
          <p className="text-xs text-slate-500">Click on the map to pin the location.</p>
        )}
      </div>

      <div className="h-80 overflow-hidden rounded-lg border border-slate-300 md:h-full">
        <LocationPicker
          value={location}
          onChange={(lat, lng) => setLocation({ lat, lng })}
        />
      </div>
    </form>
  );
}
