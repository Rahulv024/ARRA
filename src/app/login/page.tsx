"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);

    if (!res) {
      setErr("Something went wrong.");
      return;
    }
    if (res.error) {
      setErr("Invalid email or password.");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <section className="relative">
      {/* Background accent shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-16 -left-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-2">
        {/* Brand/visual side */}
        <div className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-3xl border p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/35 via-transparent to-sky-200/35 dark:from-emerald-500/10 dark:to-sky-500/10" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm ring-1 ring-emerald-200 backdrop-blur-sm dark:bg-zinc-900/60 dark:text-emerald-300 dark:ring-emerald-900/40">
                <SparkleIcon className="h-4 w-4" /> Fresh, fast and delightful
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Find recipes you’ll love.
              </h1>
              <p className="mt-3 max-w-prose text-zinc-600 dark:text-zinc-400">
                Sign in to unlock personalized recommendations, smart shopping lists, and reviews from food lovers like you.
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Feature text="AI-powered substitutions" color="emerald" />
                <Feature text="One-click meal plans" color="sky" />
                <Feature text="Save your favorites" color="violet" />
                <Feature text="5k+ community reviews" color="rose" />
              </ul>
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md">
            <div className="relative rounded-3xl border shadow-sm dark:border-zinc-800">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-white/30 dark:from-zinc-900/60 dark:to-zinc-900/30 backdrop-blur-xl" />
              <div className="relative p-7">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">Welcome back</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Sign in to continue</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-2.5 text-zinc-400">
                      <MailIcon className="h-5 w-5" />
                    </span>
                    <input
                      className="input pl-10"
                      type="text"
                      placeholder="Email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username email"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-2.5 text-zinc-400">
                      <LockIcon className="h-5 w-5" />
                    </span>
                    <input
                      className="input pl-10 pr-10"
                      type={showPwd ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1.5 rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {showPwd ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>

                  {err && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-200">
                      {err}
                    </div>
                  )}

                  <button className="btn primary w-full" disabled={busy}>
                    {busy ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  No account? {" "}
                  <Link href="/register" className="font-medium text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type FeatureColor = "emerald" | "sky" | "violet" | "rose";

function Feature({ text, color }: { text: string; color: FeatureColor }) {
  const colorMap: Record<FeatureColor, string> = {
    emerald: "from-emerald-500/15 to-emerald-400/10 text-emerald-700 dark:text-emerald-300",
    sky: "from-sky-500/15 to-sky-400/10 text-sky-700 dark:text-sky-300",
    violet: "from-violet-500/15 to-violet-400/10 text-violet-700 dark:text-violet-300",
    rose: "from-rose-500/15 to-rose-400/10 text-rose-700 dark:text-rose-300",
  } as const;
  return (
    <li className={`flex items-center gap-3 rounded-2xl border p-3 text-sm shadow-sm dark:border-zinc-800 bg-gradient-to-br ${colorMap[color]}`}>
      <CheckIcon className="h-4 w-4" />
      <span>{text}</span>
    </li>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.8 4.7L18 8.5l-4.2 1.8L12 15l-1.8-4.7L6 8.5l4.2-1.8L12 2zM4 14l.9 2.3L8 17l-3.1.7L4 20l-.9-2.3L0 17l3.1-.7L4 14zm16-8l.9 2.3L24 9l-3.1.7L20 12l-.9-2.3L16 9l3.1-.7L20 6z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
      <path d="M22 8l-10 6L2 8" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 118 0v3" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a19.66 19.66 0 015.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a19.66 19.66 0 01-3.22 4.31" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}




