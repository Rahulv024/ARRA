"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function UserMenu() {
  const { data } = useSession();
  const user = data?.user as any;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button className="btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {user.email?.split("@")[0] ?? "Profile"}
      </button>
      {/* I close the menu on outside click or Escape */}
      {open && (
        <OutsideClose onClose={() => setOpen(false)} anchorRef={ref} />
      )}
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white text-zinc-800 shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800 dark:ring-white/10">
          <div className="px-4 py-3 text-sm">
            {user.role && <div className="text-zinc-700 dark:text-zinc-400">Role: <span className="uppercase">{user.role}</span></div>}
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800" />
          <div className="p-2 text-sm">
            <Link className="menu" href="/dashboard">Dashboard</Link>
            {user.role === "ADMIN" && <Link className="menu" href="/admin">Admin</Link>}
            <Link className="menu" href="/favorites">Favorites</Link>
            <Link className="menu" href="/shopping-list">Shopping list</Link>
            <button
              className="menu text-rose-600"
              onClick={() => signOut({ callbackUrl: "/", redirect: true })}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { status } = useSession(); // I track: 'loading' | 'authenticated' | 'unauthenticated'
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-950/70 border-b dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="Go back"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full border bg-white/80 text-zinc-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-zinc-900/60 dark:text-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900"
            onClick={() => router.back()}
            title="Go back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <Link href="/" className="group flex items-center gap-3">
            <LogoLeaf className="h-6 w-6 text-emerald-600 transition-transform group-hover:scale-105" />
            <span className="font-semibold tracking-tight bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">Recipe Finder</span>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-9 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : status === "authenticated" ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login" className="btn muted">Login</Link>
              <Link href="/register" className="btn primary">Sign up</Link>
            </>
          )}
      </nav>
    </div>
  </header>
  );
}


function LogoLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M20 4c-6 0-10 2-12 6-2 4 0 8 4 8s8-4 8-14z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14c2-1 4-1 6 0" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OutsideClose({ onClose, anchorRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const el = anchorRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorRef, onClose]);
  return null;
}
