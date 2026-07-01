# Disaster-Response & Supply Allocation Hub

A real-time-feeling dashboard for coordinating disaster relief during typhoons/flash floods. Citizens and desk officers pin hyper-local needs (food, medical, evacuation, other) on a map; responders claim and update those needs so no mission gets duplicated; a predictive panel highlights areas likely to need supplies next based on historical patterns.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

**Live integrations:** Firebase Auth + Firestore, Google Maps Platform (JS API), and BigQuery are all wired up. The app runs fully without credentials in demo mode (in-memory store, OpenStreetMap tiles are replaced by Google Maps but the API key is still needed). See [Architecture & known limitations](#architecture--known-limitations) for details.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.local.example` to `.env.local` and fill in your credentials. The in-memory data store seeds itself with sample reports and historical records on first load (see `lib/data/seed.ts`) and is used as a fallback when Firebase is not configured.

### Environment variables (`.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | For auth/Firestore | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | For auth/Firestore | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | For auth/Firestore | Firebase client SDK; also enables BigQuery path |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | For auth/Firestore | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | For auth/Firestore | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | For auth/Firestore | Firebase client SDK |
| `NEXT_PUBLIC_GMAPS_API_KEY` | For maps | Google Maps JavaScript API — Maps, Marker, Visualization libraries |
| `NEXT_PUBLIC_BASE_URL` | Production only | Absolute base URL for server-to-server API calls (e.g. `https://your-app.com`) |

For local API routes that use Firebase Admin SDK, also set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON key path, or deploy on GCP where Application Default Credentials are picked up automatically.

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

### `components/map/` — Google Maps pieces
All client components (`"use client"`), consumed via `next/dynamic(..., { ssr: false })` from their parents since the Maps JS API touches `window` at load time. Each component loads the API lazily via `@googlemaps/js-api-loader` (singleton promise, so the script is only fetched once).

- **`disaster-map.tsx`** — the main map: Google Maps with `AdvancedMarkerElement` pins colour-coded by urgency and a `HeatmapLayer` (`visualization` library) weighted by urgency. Used on `/dashboard`.
- **`location-picker.tsx`** — click-to-pin map on the report submission form; drops an `AdvancedMarkerElement` where the user clicks and reports the lat/lng back.

### `components/reports/` — report submission and management UI
- **`report-form.tsx`** — the `/report` submission form: need type, urgency, area, description, optional contact info, plus the embedded `LocationPicker`. Submits via the `createReportAction` Server Action (React `useActionState`).
- **`report-filters.tsx`** — type/status dropdown filters shared between the map and list views on `/dashboard`.
- **`report-list.tsx`** — renders a list of `ReportCard`s, or an empty state if filters match nothing.
- **`report-card.tsx`** — a compact summary row (type, area, urgency/status badges, description snippet) that opens the `ClaimPanel` when clicked.
- **`claim-panel.tsx`** — the modal for managing a single report: claim it (open → claimed), then advance it through the workflow (claimed → in_progress → resolved). Calls the `claimReportAction`/`updateStatusAction` Server Actions and surfaces their errors (e.g. "already claimed by someone else").

### `components/insights/`
- **`insights-map.tsx`** / **`insights-map-wrapper.tsx`** — Google Maps view of predicted high-need areas: each area is a `google.maps.Circle` sized and colour-coded by its risk score; clicking opens an `InfoWindow` with the details.
- **`predicted-areas-panel.tsx`** — the ranked sidebar list of `PredictedAreaInsight`s — area name, dominant need type, sample size, and score.

### `components/layout/`
- **`nav.tsx`** — the top navigation bar (Home / Report a Need / Dashboard / Insights), used in the root layout.
- **`status-badge.tsx`** — two small presentational components, `UrgencyBadge` and `StatusPill`, both driven by `lib/ui/urgency-colors.ts`.

### `app/` — routes
- **`layout.tsx`** — root layout: fonts, global nav, and a fixed light theme (no dark-mode variant — the whole UI assumes a white background, so `prefers-color-scheme: dark` is intentionally not wired up in `globals.css`).
- **`page.tsx`** — landing page (`/`): a server component that fetches report counts directly from `lib/data/reports.ts` and shows a stat summary plus links into the app.
- **`report/page.tsx`** + **`report/actions.ts`** — the report submission route. `actions.ts` holds `createReportAction`, a Server Action (`"use server"`) that validates form input, calls `lib/data/reports.createReport`, and calls `revalidatePath` so the dashboard picks up the new report.
- **`dashboard/page.tsx`** — server component that does the initial `getReports()` fetch, then hands off to `dashboard-client.tsx`.
- **`dashboard/dashboard-client.tsx`** — the interactive heart of the app: holds filter state, the selected report, and the responder name; renders the map, filters, list, and claim panel together. Uses Firestore `onSnapshot` for real-time updates when signed in; falls back to 9-second polling otherwise.
- **`dashboard/actions.ts`** — Server Actions used by the dashboard: `claimReportAction`, `updateStatusAction`, and `refetchReportsAction` (polling fallback).
- **`insights/page.tsx`** — server component that calls `lib/data/predictions.getPredictedInsights()` and renders the insights map and panel.
- **`api/tasks/`** — REST endpoints backed by Firebase Admin SDK: `POST /api/tasks` (create), `POST /api/tasks/[id]/claim`, `POST /api/tasks/[id]/resolve`, `GET /api/tasks/nearby`.
- **`api/insights/`** — `GET /api/insights`: queries BigQuery for recency-weighted area risk scores; falls back to an empty array when BQ is unavailable.

## Architecture & known limitations

- **Auth** — Firebase Auth (email/password). The responder name input on the dashboard is a secondary identifier for legacy mock reports; real tasks use the Firebase UID. The `lib/use-responder-name.ts` hook is not a security boundary.
- **Persistence** — Firestore when credentials are present; `lib/data/store.ts` in-memory fallback when not. The in-memory store resets on server restart.
- **Concurrency control** — claim/resolve go through Firestore transactions in the API routes (`app/api/tasks/`), which are race-safe. The mock path (`lib/data/reports.ts`) is a simple check-then-set adequate for a single process.
- **Real-time sync** — Firestore `onSnapshot` subscription in `dashboard-client.tsx` when the user is signed in; falls back to 9-second polling via `refetchReportsAction` otherwise.
- **Maps** — Google Maps JavaScript API (`@googlemaps/js-api-loader`). Requires `NEXT_PUBLIC_GMAPS_API_KEY`. The `marker` library (AdvancedMarkerElement) requires a `mapId` — use any map ID from Cloud Console or the placeholder `"DEMO_MAP_ID"` for local dev.
- **BigQuery** — nightly Cloud Function (`functions/src/exportToBigQuery.ts`) streams resolved/updated tasks from Firestore into `emergency_response.tasks_history`. The Insights page queries this table via `GET /api/insights`; falls back to the local heuristic if BQ is unreachable. Run `bash bigquery/setup.sh` once to create the dataset and tables.
- **Cloud Functions** — `claimTask`, `resolveTask`, `exportToBigQuery` live in `functions/`. Deploy with `firebase deploy --only functions`.

## Learn more about Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
