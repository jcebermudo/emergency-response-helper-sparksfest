"use client";

/**
 * LocationPicker — Leaflet/OpenStreetMap implementation.
 * Click anywhere on the map to drop a pin and capture lat/lng.
 *
 * Uses Leaflet instead of Google Maps for the demo — no API key/quota
 * dependency (see lib/demo-mode.ts).
 */

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const METRO_MANILA_CENTER: [number, number] = [14.65, 121.05];

const pinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
    <path fill="#dc2626" stroke="white" stroke-width="1.5" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 7 15.5 7.3 15.9.2.3.7.3.9 0C12.5 23.5 20 13.4 20 8c0-4.4-3.6-8-8-8z"/>
    <circle cx="12" cy="8" r="3" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer's `center` prop only applies on initial mount — react-leaflet
// doesn't re-pan on prop changes, so an externally-picked point (e.g. from
// the area autocomplete, as opposed to a direct map click) needs an
// explicit flyTo to bring the map to it.
function RecenterOnFocus({ focus }: { focus: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 15));
  }, [focus, map]);
  return null;
}

export function LocationPicker({
  value,
  onChange,
  focus,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  /** Set (e.g. from an autocomplete pick) to pan/zoom the map there — distinct
   *  from `value` so a plain map click doesn't also trigger a fly-to. */
  focus?: { lat: number; lng: number } | null;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : METRO_MANILA_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      <RecenterOnFocus focus={focus ?? null} />
      {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
    </MapContainer>
  );
}
