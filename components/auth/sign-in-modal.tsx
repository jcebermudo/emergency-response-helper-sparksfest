"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "citizen", label: "Citizen — report a need" },
  { value: "desk_officer", label: "Desk Officer — manage reports" },
  { value: "responder", label: "Responder — claim & resolve tasks" },
  { value: "lgu", label: "LGU — full access" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setError("Display name is required.");
          setPending(false);
          return;
        }
        await signUp(email, password, displayName.trim(), role);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      const cleaned = msg.replace("Firebase: ", "").trim();
      setError(cleaned || "An unknown error occurred.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setTab("signin"); setError(null); }}
            className={`pb-2 pr-4 text-sm font-medium ${
              tab === "signin"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setError(null); }}
            className={`pb-2 pl-2 text-sm font-medium ${
              tab === "signup"
                ? "border-b-2 border-red-600 text-red-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700">Display name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending
              ? tab === "signin" ? "Signing in…" : "Creating account…"
              : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
