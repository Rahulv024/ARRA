"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      aria-label="Toggle theme"
      className="btn ghost text-zinc-800 dark:text-amber-400"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Lights on" : "Lights off"}
    >
      {isDark ? (
        <BulbOn className="h-4 w-4 text-amber-400 drop-shadow" />
      ) : (
        <BulbOff className="h-4 w-4 text-amber-600" />
      )}
    </button>
  );
}

function BulbOn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 00-4.5 12.3c.8.7 1.3 1.6 1.5 2.6h6c.2-1 .7-1.9 1.5-2.6A7 7 0 0012 2zM9 20h6a1 1 0 010 2H9a1 1 0 010-2z" />
    </svg>
  );
}

function BulbOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3a7 7 0 00-4.5 12.3c.8.7 1.3 1.6 1.5 2.6h6c.2-1 .7-1.9 1.5-2.6A7 7 0 0012 3z" />
      <path d="M9 20h6M2 2l20 20" />
    </svg>
  );
}
