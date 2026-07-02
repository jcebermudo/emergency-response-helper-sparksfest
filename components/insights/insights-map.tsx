"use client";

/**
 * InsightsMap — shows predicted high-need areas on the map.
 * Each area is a circle marker sized and colored by its risk score.
 *
 * Uses Leaflet instead of Google Maps for the demo — no API key/quota
 * dependency (see lib/demo-mode.ts).
 */

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { PredictedAreaInsight } from "@/lib/types";
import { needTypeLabels } from "@/lib/ui/urgency-colors";

const METRO_MANILA_CENTER: [number, number] = [14.65, 121.05];

function scoreToColor(score: number): string {
  if (score >= 15) return "#dc2626"; // red — critical
  if (score >= 10) return "#f97316"; // orange — high
  if (score >= 5)  return "#eab308"; // yellow — medium
  return "#3b82f6";                  // blue — low
}

function scoreToRadius(score: number): number {
  return Math.max(12, Math.min(34, score * 1.8));
}

export function InsightsMap({ insights }: { insights: PredictedAreaInsight[] }) {
  return (
    <MapContainer
      center={METRO_MANILA_CENTER}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {insights.map((insight, i) => (
        <CircleMarker
          key={insight.area}
          center={[insight.lat, insight.lng]}
          radius={scoreToRadius(insight.score)}
          pathOptions={{
            color: scoreToColor(insight.score),
            fillColor: scoreToColor(insight.score),
            fillOpacity: 0.45,
            weight: 2,
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm min-w-[160px]">
              <p className="font-semibold">
                #{i + 1} {insight.area}
              </p>
              <p className="text-slate-600">
                Likely need: {needTypeLabels[insight.dominantNeedType]}
              </p>
              <p className="text-slate-500">
                Risk score: <strong>{insight.score.toFixed(1)}</strong> &middot;{" "}
                {insight.sampleSize} historical incidents
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
