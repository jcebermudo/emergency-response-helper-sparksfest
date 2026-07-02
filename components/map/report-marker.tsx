"use client";

import { useRef } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { Report } from "@/lib/types";
import { StatusPill, UrgencyBadge } from "@/components/layout/status-badge";
import { needTypeLabels, urgencyDotColor } from "@/lib/ui/urgency-colors";
import { useReportActions } from "@/lib/use-report-actions";

// Inline SVG icons instead of Leaflet's default image-based markers — sidesteps
// the well-known bundler broken-icon-path issue with Leaflet's default assets.
function svgIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
    <path fill="${color}" stroke="white" stroke-width="1.5" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 7 15.5 7.3 15.9.2.3.7.3.9 0C12.5 23.5 20 13.4 20 8c0-4.4-3.6-8-8-8z"/>
    <circle cx="12" cy="8" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

/**
 * ReportMarker — pin on the dashboard map. Clicking it opens Leaflet's
 * bound popup (its default behavior, no extra handler needed) with the
 * report's info and a claim/advance button right there — one of two ways
 * to claim a report, the other being the centered ClaimPanel modal opened
 * from a Kanban/list card. Both share their logic via lib/use-report-actions.
 */
export function ReportMarker({
  report,
  responderName,
  onUpdated,
}: {
  report: Report;
  responderName: string;
  onUpdated: (report: Report) => void;
}) {
  const icon = svgIcon(urgencyDotColor[report.urgency]);
  const markerRef = useRef<L.Marker>(null);
  const { pending, error, next, handleClaim, handleAdvance } = useReportActions(
    report,
    responderName,
    onUpdated
  );

  return (
    <Marker ref={markerRef} position={[report.location.lat, report.location.lng]} icon={icon}>
      <Popup minWidth={240}>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">
            {needTypeLabels[report.type]} &mdash; {report.area}
          </p>

          <div className="flex gap-1.5">
            <UrgencyBadge urgency={report.urgency} />
            <StatusPill status={report.status} />
          </div>

          <p className="text-slate-700">{report.description}</p>
          {report.claimedBy && (
            <p className="text-xs text-slate-500">Claimed by: {report.claimedBy}</p>
          )}

          {!responderName.trim() && (
            <p className="text-xs text-amber-600">
              Enter your responder name above before claiming.
            </p>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {report.status === "open" && (
              <button
                type="button"
                onClick={handleClaim}
                disabled={pending || !responderName.trim()}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {pending ? "Claiming..." : "Claim this report"}
              </button>
            )}
            {next && (
              <button
                type="button"
                onClick={handleAdvance}
                disabled={pending || !responderName.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {pending ? "Updating..." : `Mark as ${next.replace("_", " ")}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => markerRef.current?.closePopup()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
