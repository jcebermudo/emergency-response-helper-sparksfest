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
const STATUSES: ReportStatus[] = ["open", "open", "open", "claimed", "in_progress", "resolved"];

// Each description is paired with the urgency it actually implies, so a
// life-threatening report can never be mislabeled "low" (and a minor
// inconvenience can't be mislabeled "critical").
const SCENARIOS: Record<NeedType, { description: string; urgency: UrgencyLevel }[]> = {
  food: [
    {
      description: "Family of 6 has had no food or clean water for 3 days, youngest child is an infant and getting dehydrated.",
      urgency: "critical",
    },
    {
      description: "Elderly couple with no mobility aid trapped in a flooded home, out of food, water rising toward the kitchen counter.",
      urgency: "high",
    },
    {
      description: "Community kitchen ran out of rice and canned goods, about 40 people still need dinner tonight.",
      urgency: "medium",
    },
    {
      description: "Household is low on snacks and coffee but has enough rice and canned goods for a few more days.",
      urgency: "low",
    },
  ],
  medical: [
    {
      description: "Diabetic patient has been without insulin for over 24 hours and is showing signs of a diabetic emergency.",
      urgency: "critical",
    },
    {
      description: "Woman in active labor, contractions minutes apart, road to the nearest clinic is flooded and impassable by car.",
      urgency: "critical",
    },
    {
      description: "Resident has a deep laceration from debris that won't stop bleeding, needs wound care supplies urgently.",
      urgency: "high",
    },
    {
      description: "Several residents have minor cuts and scrapes from wading through debris, need basic first aid supplies.",
      urgency: "medium",
    },
    {
      description: "Family requesting extra allergy medication as a precaution, no immediate symptoms.",
      urgency: "low",
    },
  ],
  evacuation: [
    {
      description: "Family of 5, including two small children, trapped on their roof as water continues to rise, need boat rescue now.",
      urgency: "critical",
    },
    {
      description: "20 households in a low-lying block need evacuation, water is waist-deep and rising fast, several non-swimmers among them.",
      urgency: "critical",
    },
    {
      description: "Nearby evacuation center has reached full capacity, roughly 15 families still need an overflow site before nightfall.",
      urgency: "high",
    },
    {
      description: "Residents on the second floor are safe for now but want to evacuate before the access road floods completely.",
      urgency: "medium",
    },
    {
      description: "A few residents are asking about evacuation center locations for tomorrow as a precaution, no immediate danger.",
      urgency: "low",
    },
  ],
  other: [
    {
      description: "Evacuation center generator has failed, no power for the oxygen concentrators several elderly evacuees depend on.",
      urgency: "critical",
    },
    {
      description: "Tap water in the area is visibly contaminated with sewage runoff, dozens of households have no safe drinking water.",
      urgency: "high",
    },
    {
      description: "Evacuation center needs a generator, power has been out for hours and phones are running low on battery.",
      urgency: "medium",
    },
    {
      description: "Evacuees are cold overnight and need extra blankets and dry clothes, no immediate health risk.",
      urgency: "low",
    },
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
    const scenario = pick(SCENARIOS[type], i);
    const createdAt = new Date(now - i * 3600_000).toISOString();

    reports.push({
      id: nextId("report"),
      type,
      location: { lat: jitter(location.lat, i), lng: jitter(location.lng, i + 1) },
      area: location.area,
      description: scenario.description,
      urgency: scenario.urgency,
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
