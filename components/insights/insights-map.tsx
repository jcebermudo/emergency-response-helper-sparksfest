"use client";

/**
 * InsightsMap — Google Maps implementation.
 * Shows predicted high-need areas as circle overlays sized and coloured by risk score.
 */

import { useEffect, useRef } from "react";
import { loadLibrary } from "@/lib/gmaps";
import type { PredictedAreaInsight } from "@/lib/types";
import { needTypeLabels } from "@/lib/ui/urgency-colors";

const METRO_MANILA_CENTER = { lat: 14.65, lng: 121.05 };

function scoreToColor(score: number): string {
  if (score >= 15) return "#dc2626"; // red — critical
  if (score >= 10) return "#f97316"; // orange — high
  if (score >= 5)  return "#eab308"; // yellow — medium
  return "#3b82f6";                  // blue — low
}

function scoreToRadius(score: number): number {
  // metres — clamp between 800 m and 3 000 m
  return Math.max(800, Math.min(3000, score * 150));
}

export function InsightsMap({ insights }: { insights: PredictedAreaInsight[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadLibrary("maps").then(({ Map }) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = new Map(containerRef.current, {
          center: METRO_MANILA_CENTER,
          zoom: 11,
          mapId: "insights-map",
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Sync circles whenever insights change
  useEffect(() => {
    if (!mapRef.current) return;

    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const map = mapRef.current;

    loadLibrary("maps").then(({ Circle, InfoWindow }) => {
      insights.forEach((insight, i) => {
        const color = scoreToColor(insight.score);

        const circle = new Circle({
          map,
          center: { lat: insight.lat, lng: insight.lng },
          radius: scoreToRadius(insight.score),
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.35,
        });

        const infoWindow = new InfoWindow({
          content: `
            <div style="font-size:13px;min-width:160px;line-height:1.5">
              <strong>#${i + 1} ${insight.area}</strong><br/>
              Likely need: ${needTypeLabels[insight.dominantNeedType] ?? insight.dominantNeedType}<br/>
              <span style="color:#555">Risk score: <strong>${insight.score.toFixed(1)}</strong> &middot; ${insight.sampleSize} incidents</span>
            </div>`,
        });

        circle.addListener("click", (e: google.maps.MapMouseEvent) => {
          infoWindow.setPosition(e.latLng);
          infoWindow.open(map);
        });

        circlesRef.current.push(circle);
      });
    });
  }, [insights]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
