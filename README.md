# Disaster-Response & Supply Allocation Hub

A real-time-feeling dashboard for coordinating disaster relief during typhoons/flash floods. Citizens and desk officers pin hyper-local needs (food, medical, evacuation, other) on a map; responders claim and update those needs so no mission gets duplicated; a predictive panel highlights areas likely to need supplies next based on historical patterns.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

**This is a mock/local-first prototype.** There are no real Firebase, Google Maps Platform, or BigQuery credentials wired up — see [Architecture & known limitations](#architecture--known-limitations) below for what's mocked and how it's structured to be swapped for real backends later.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The in-memory data store seeds itself with sample reports and historical records on first load (see `lib/data/seed.ts`).

## File-by-file guide

### `lib/types.ts`
The shared data model for the whole app: `NeedType`, `UrgencyLevel`, `ReportStatus`, `Report`, `NewReportInput`, `Responder`, `HistoricalRecord`, and `PredictedAreaInsight`. Every other file imports from here — this is the single source of truth for shape of the data flowing through the UI, actions, and data layer.

### `lib/data/` — the mock backend
This directory is the seam where a real backend would plug in later. Nothing here imports React or `next/*`; every function is `async` even though the store underneath is synchronous, so call sites won't need to change when this is swapped for real Firestore/BigQuery calls.

- **`store.ts`** — the in-memory array of reports and historical records, cached on `globalThis` so it survives Next's dev-mode Fast Refresh. Resets on server restart — this is a demo store, not durable storage.
- **`seed.ts`** — generates realistic-looking sample data: ~18 `Report`s and ~50 `HistoricalRecord`s spread across real, recognizable flood-prone Metro Manila barangays (Marikina, Cainta, Rodriguez/Montalban, Pasig, Quezon City, Navotas, Malabon) with real approximate coordinates. Historical record volume is deliberately uneven per area so the predictive ranking in `/insights` produces a differentiated result instead of a flat tie.
- **`reports.ts`** — the public CRUD interface: `getReports(filters)`, `getReportById(id)`, `createReport(input)`, `claimReport(id, responderName)`, `updateReportStatus(id, status, responderName)`. `claimReport` guards against double-claiming a report someone else already took — that check-then-set is the exact spot a real Firestore transaction would go.
- **`predictions.ts`** — `getPredictedInsights()`, a naive recency + frequency-weighted heuristic over `HistoricalRecord`s, grouped by area and ranked. Explicitly commented as a mock stand-in for a future BigQuery ML query; the return shape (`PredictedAreaInsight[]`) is meant to stay stable when that swap happens.

### `lib/ui/urgency-colors.ts`
Central mapping from `UrgencyLevel`/`ReportStatus`/`NeedType` enum values to Tailwind classes and labels (badge colors, marker dot colors, human-readable labels). Every component that renders a status pill, urgency badge, or map marker pulls from here so the color coding stays consistent across the map, list, form, and claim panel.

### `lib/use-responder-name.ts`
A client hook that reads/writes a responder's display name to `localStorage` via `useSyncExternalStore`. This is the entire "auth" system in this prototype — there's no real login, just a name typed once and remembered locally. **Not a security boundary**; anyone can claim a report as anyone. Flagged deliberately as a simplification, not an oversight.

### `lib/types/leaflet.heat.d.ts`
A hand-written TypeScript shim for the `leaflet.heat` package, which ships no official types. Declares `heatLayer()` and `HeatLayer` as an augmentation of the `leaflet` module (note the `export {}` at the top — required so TypeScript treats this file as a module and *merges* with `@types/leaflet` instead of shadowing it and breaking `MapContainer`'s prop types).

### `components/map/` — Leaflet map pieces
All client components (`"use client"`), and all consumed via `next/dynamic(..., { ssr: false })` from their parents, since Leaflet touches `window` at import time and would break server rendering otherwise.

- **`disaster-map.tsx`** — the main map: OpenStreetMap tile layer, a `HeatmapLayer`, and a `ReportMarker` per report. Used on `/dashboard`.
- **`heatmap-layer.tsx`** — wraps `leaflet.heat`, plotting each report as a heat point weighted by urgency (critical reports contribute more "heat" than low-urgency ones).
- **`report-marker.tsx`** — an individual pin on the map with a popup summary; color-coded by urgency via `lib/ui/urgency-colors.ts`. Uses inline SVG icons instead of Leaflet's default image-based markers, sidestepping a well-known bundler asset-path issue.
- **`location-picker.tsx`** — the click-to-pin map used on the report submission form; tracks a single lat/lng and drops a pin where the user clicks.

### `components/reports/` — report submission and management UI
- **`report-form.tsx`** — the `/report` submission form: need type, urgency, area, description, optional contact info, plus the embedded `LocationPicker`. Submits via the `createReportAction` Server Action (React `useActionState`).
- **`report-filters.tsx`** — type/status dropdown filters shared between the map and list views on `/dashboard`.
- **`report-list.tsx`** — renders a list of `ReportCard`s, or an empty state if filters match nothing.
- **`report-card.tsx`** — a compact summary row (type, area, urgency/status badges, description snippet) that opens the `ClaimPanel` when clicked.
- **`claim-panel.tsx`** — the modal for managing a single report: claim it (open → claimed), then advance it through the workflow (claimed → in_progress → resolved). Calls the `claimReportAction`/`updateStatusAction` Server Actions and surfaces their errors (e.g. "already claimed by someone else").

### `components/insights/predicted-areas-panel.tsx`
Renders the ranked list of `PredictedAreaInsight`s on `/insights` — area name, dominant need type, sample size, and score.

### `components/layout/`
- **`nav.tsx`** — the top navigation bar (Home / Report a Need / Dashboard / Insights), used in the root layout.
- **`status-badge.tsx`** — two small presentational components, `UrgencyBadge` and `StatusPill`, both driven by `lib/ui/urgency-colors.ts`.

### `app/` — routes
- **`layout.tsx`** — root layout: fonts, global nav, and a fixed light theme (no dark-mode variant — the whole UI assumes a white background, so `prefers-color-scheme: dark` is intentionally not wired up in `globals.css`).
- **`page.tsx`** — landing page (`/`): a server component that fetches report counts directly from `lib/data/reports.ts` and shows a stat summary plus links into the app.
- **`report/page.tsx`** + **`report/actions.ts`** — the report submission route. `actions.ts` holds `createReportAction`, a Server Action (`"use server"`) that validates form input, calls `lib/data/reports.createReport`, and calls `revalidatePath` so the dashboard picks up the new report.
- **`dashboard/page.tsx`** — server component that does the initial `getReports()` fetch, then hands off to `dashboard-client.tsx`.
- **`dashboard/dashboard-client.tsx`** — the interactive heart of the app: holds filter state, the selected report, and the responder name; renders the map, filters, list, and claim panel together. Includes a polling `useEffect` (every ~9s) that re-fetches reports to simulate other users' changes showing up live — explicitly commented as a stand-in for a Firebase `onSnapshot` listener, which is where real-time sync would plug in later.
- **`dashboard/actions.ts`** — Server Actions used by the dashboard: `claimReportAction`, `updateStatusAction`, and `refetchReportsAction` (used by the polling effect).
- **`insights/page.tsx`** — server component that calls `lib/data/predictions.getPredictedInsights()` and renders `PredictedAreasPanel`.

## Architecture & known limitations

This prototype intentionally trades real backend integration for a fast, demoable UI, structured so the swap is localized:

- **No real auth.** Responder identity is just a typed name cached in `localStorage` (`lib/use-responder-name.ts`). Fine for a demo; not a security boundary.
- **No durable persistence.** `lib/data/store.ts` is an in-memory array — data resets on server restart.
- **No real concurrency control.** The duplicate-claim guard in `lib/data/reports.ts` is a simple in-process check-then-set; adequate for a single server process, would need a transaction against real Firestore.
- **Map uses OpenStreetMap, not Google Maps Platform.** No Google Maps API key is required to run this. Swapping to Google Maps Platform means replacing the contents of `components/map/`.
- **"Real-time" sync is polling, not Firebase.** `dashboard-client.tsx`'s polling effect is the stand-in for a `onSnapshot` listener.
- **Predictive insights are a mocked heuristic**, not a real BigQuery ML model — see the comment block at the top of `lib/data/predictions.ts`.

The common thread: `lib/data/*.ts` is the seam. Real backends (Firestore, BigQuery, Google Maps) can replace what's behind these files without touching the route or component code that calls them.

## Learn more about Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
