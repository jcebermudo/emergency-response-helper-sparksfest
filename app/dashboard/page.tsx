import { getReports } from "@/lib/data/reports";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const reports = await getReports();

  return (
    <main className="flex flex-1 flex-col px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Active resource requests across flood-prone areas. Claim a report to
        take ownership and prevent duplicated missions.
      </p>
      <div className="mt-4 flex-1">
        <DashboardClient initialReports={reports} />
      </div>
    </main>
  );
}
