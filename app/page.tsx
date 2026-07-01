import Link from "next/link";
import { getReports } from "@/lib/data/reports";

export default async function Home() {
  const reports = await getReports();
  const open = reports.filter((r) => r.status === "open").length;
  const critical = reports.filter((r) => r.urgency === "critical" && r.status !== "resolved").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Disaster-Response &amp; Supply Allocation Hub
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          During typhoons and flash floods, hyper-local needs get scattered across
          social media. This hub lets citizens and desk officers pin active needs
          on a map, and lets responders claim and update them so no mission is
          duplicated.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-slate-900">{open}</p>
          <p className="text-sm text-slate-500">Open reports</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-red-600">{critical}</p>
          <p className="text-sm text-slate-500">Critical & active</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-2xl font-bold text-green-600">{resolved}</p>
          <p className="text-sm text-slate-500">Resolved</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/report"
          className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Report a Need
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
