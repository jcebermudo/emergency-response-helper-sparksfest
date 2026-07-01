import type {
  HistoricalRecord,
  NeedType,
  Report,
  ReportStatus,
  UrgencyLevel,
} from "@/lib/types";

// Real, recognizable flood-prone Metro Manila-area barangays/localities with
// approximate coordinates, used to make demo data look realistic.
const AREAS = [
  { area: "Barangka, Marikina City", lat: 14.6297, lng: 121.0929 },
  { area: "Malanday, Marikina City", lat: 14.6423, lng: 121.1027 },
  { area: "Cainta, Rizal", lat: 14.5786, lng: 121.1222 },
  { area: "Rodriguez (Montalban), Rizal", lat: 14.7256, lng: 121.1236 },
  { area: "Rosario, Pasig City", lat: 14.5764, lng: 121.0851 },
  { area: "Manggahan, Pasig City", lat: 14.5764, lng: 121.1 },
  { area: "Payatas, Quezon City", lat: 14.7169, lng: 121.1122 },
  { area: "Batasan Hills, Quezon City", lat: 14.6907, lng: 121.1044 },
  { area: "Tanza, Navotas City", lat: 14.6667, lng: 120.9437 },
  { area: "Tugatog, Malabon City", lat: 14.6667, lng: 120.9578 },
];

const NEED_TYPES: NeedType[] = ["food", "medical", "evacuation", "other"];
const URGENCY_LEVELS: UrgencyLevel[] = ["low", "medium", "high", "critical"];
const STATUSES: ReportStatus[] = ["open", "open", "open", "claimed", "in_progress", "resolved"];

const DESCRIPTIONS: Record<NeedType, string[]> = {
  food: [
    "Family of 6 stranded on second floor, no food for 2 days.",
    "Community kitchen ran out of rice and canned goods.",
    "Elderly couple needs food delivery, roads impassable.",
  ],
  medical: [
    "Diabetic patient needs insulin, pharmacy flooded.",
    "Pregnant woman needs transport to nearest clinic.",
    "Several residents with wounds, need first aid supplies.",
  ],
  evacuation: [
    "20 households need evacuation, water rising fast.",
    "Nearby evacuation center at full capacity, need overflow site.",
    "Trapped residents on rooftop, need boat rescue.",
  ],
  other: [
    "Need clean drinking water, tap water contaminated.",
    "Generator needed for evacuation center, power out.",
    "Blankets and dry clothes needed for evacuees.",
  ],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function jitter(value: number, seed: number): number {
  return value + ((seed % 7) - 3) * 0.003;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function seedReports(): Report[] {
  const reports: Report[] = [];
  const now = Date.now();

  for (let i = 0; i < 18; i++) {
    const location = pick(AREAS, i);
    const type = pick(NEED_TYPES, i * 3);
    const status = pick(STATUSES, i * 5);
    const urgency = pick(URGENCY_LEVELS, i * 2);
    const createdAt = new Date(now - i * 3600_000).toISOString();

    reports.push({
      id: nextId("report"),
      type,
      location: { lat: jitter(location.lat, i), lng: jitter(location.lng, i + 1) },
      area: location.area,
      description: pick(DESCRIPTIONS[type], i),
      urgency,
      status,
      claimedBy: status === "open" ? undefined : `Responder ${(i % 4) + 1}`,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return reports;
}

// Number of historical records per area, and how recent they skew — uneven on
// purpose so the predictive heuristic in lib/data/predictions.ts produces a
// differentiated, demo-realistic ranking instead of a flat tie.
const AREA_HISTORY_WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 3, 2, 2];

export function seedHistoricalRecords(): HistoricalRecord[] {
  const records: HistoricalRecord[] = [];
  const now = Date.now();
  let counter = 0;

  AREAS.forEach((location, areaIndex) => {
    const count = AREA_HISTORY_WEIGHTS[areaIndex] ?? 2;
    for (let j = 0; j < count; j++) {
      const type = pick(NEED_TYPES, counter * 11);
      // Higher-weighted (more flood-prone) areas skew recent; lower-weighted
      // areas skew older, so recency and frequency both drive the ranking.
      const maxDaysAgo = 10 + areaIndex * 12;
      const daysAgo = (j * 13 + areaIndex * 5) % maxDaysAgo;

      records.push({
        area: location.area,
        lat: jitter(location.lat, counter),
        lng: jitter(location.lng, counter + 2),
        type,
        timestamp: new Date(now - daysAgo * 86_400_000).toISOString(),
      });
      counter += 1;
    }
  });

  return records;
}
