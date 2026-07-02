"use client";

import Link from "next/link";
import { useResponderName } from "@/lib/use-responder-name";

// Real Firebase sign-in is blocked for the demo (see lib/demo-mode.ts) —
// identity comes from the port-based fake login instead (lib/demo-user.ts),
// surfaced here via useResponderName. components/auth/sign-in-modal.tsx and
// lib/auth-context.tsx stay in the codebase, just unused for now.
export function Nav() {
  const { name } = useResponderName();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-slate-900 tracking-tight">
          L.I.G.T.A.S.
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/report" className="hover:text-slate-900">
            Report a Need
          </Link>
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/insights" className="hover:text-slate-900">
            Insights
          </Link>

          {/* Blank (no fake login) outside dev until a responder name is set —
              see lib/demo-user.ts */}
          {name.trim() && (
            <span className="rounded-md border border-slate-300 px-3 py-1 text-xs">
              Signed in as <span className="font-semibold text-slate-900">{name}</span>
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
