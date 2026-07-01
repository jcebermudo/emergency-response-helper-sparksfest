import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Disaster Response Hub
        </Link>
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <Link href="/report" className="hover:text-slate-900">
            Report a Need
          </Link>
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/insights" className="hover:text-slate-900">
            Insights
          </Link>
        </div>
      </div>
    </nav>
  );
}
