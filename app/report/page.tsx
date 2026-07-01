import { ReportForm } from "@/components/reports/report-form";

export default function ReportPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Report a Need</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pin the location on the map, describe the need, and submit. Responders
        will see it immediately on the dashboard.
      </p>
      <div className="mt-6">
        <ReportForm />
      </div>
    </main>
  );
}
