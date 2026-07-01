"use client";

import dynamic from "next/dynamic";
import type { PredictedAreaInsight } from "@/lib/types";

const InsightsMap = dynamic(
  () => import("@/components/insights/insights-map").then((m) => m.InsightsMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 rounded-lg" /> }
);

export function InsightsMapWrapper({ insights }: { insights: PredictedAreaInsight[] }) {
  return <InsightsMap insights={insights} />;
}
