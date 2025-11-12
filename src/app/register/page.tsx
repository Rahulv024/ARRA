"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, invite }),
    });

    const raw = await res.text();
    let data: any = null;
    if (raw) {
      try { data = JSON.parse(raw); } catch {}
    }

    if (!res.ok) {
      setErr(data?.error || raw || `Failed (${res.status})`);
      setLoading(false);
      return;
    }

    setOk(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 800);
  };

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-sm text-zinc-600">Start discovering recipes</p>
        </div>

        {err && (
          <div className="mb-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-rose-700 text-sm">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700 text-sm">
            Account created. Redirecting…
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <input
              className="input"
              type="password"
              placeholder="Password (min 8)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {/* Optional: enter ADMIN role via invite code */}
          <label className="block">
            <span className="sr-only">Admin invite (optional)</span>
            <input
              className="input"
              type="text"
              placeholder="Admin invite (optional)"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </label>

          <button className="btn primary w-full" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
