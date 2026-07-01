"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { Report } from "@/lib/types";
import { needTypeLabels, statusLabels, urgencyDotColor } from "@/lib/ui/urgency-colors";

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

export function ReportMarker({
  report,
  onSelect,
}: {
  report: Report;
  onSelect?: (reportId: string) => void;
}) {
  const icon = svgIcon(urgencyDotColor[report.urgency]);

  return (
    <Marker
      position={[report.location.lat, report.location.lng]}
      icon={icon}
      eventHandlers={onSelect ? { click: () => onSelect(report.id) } : undefined}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{needTypeLabels[report.type]}</p>
          <p className="text-slate-600">{report.area}</p>
          <p>{report.description}</p>
          <p className="text-xs text-slate-500">
            Urgency: {report.urgency} &middot; Status: {statusLabels[report.status]}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
