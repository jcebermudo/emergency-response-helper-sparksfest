"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { useResponderName } from "@/lib/use-responder-name";

// Real Firebase sign-in/out lives alongside the fake port-based demo
// identity (lib/demo-user.ts, dev-only) — the two are independent: Firebase
// Auth itself isn't blocked, only Firestore reads/writes are (DEMO_MODE,
// see lib/demo-mode.ts), so signing in here still works.
export function Nav() {
  const { user, loading, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const { name } = useResponderName();

  return (
    <>
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

            {!loading && (
              user ? (
                <button
                  onClick={() => signOut()}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
}
