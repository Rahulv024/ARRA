"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function FavoriteButton({ item }: { item: any }) {
  const { status } = useSession();
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  // I initialize favorite state only if you are logged in
  useEffect(() => {
    let alive = true;
    if (status !== "authenticated") {
      setOn(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/user/favorite?recipeId=${item.id}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        setOn(res.ok ? !!j.favorited : false);
      } catch {
        setOn(false);
      }
    })();
    return () => { alive = false; };
  }, [item?.id, status]);

  const toggle = async () => {
    if (status !== "authenticated") {
      alert("Please sign in to manage favorites.");
      return;
    }
    if (on === null || busy) return;
    setBusy(true);
    const prev = on;
    setOn(!prev);
    try {
      const res = await fetch("/api/user/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: item.id, recipe: item }),
      });
      if (!res.ok) throw new Error();
      const j = await res.json();
      setOn(!!j.favorited);
    } catch {
      setOn(prev);
      alert("Could not update favorite.");
    } finally {
      setBusy(false);
    }
  };

  const active = !!on;
  return (
    <button
      aria-label="Favorite"
      className={`h-9 w-9 rounded-full border flex items-center justify-center transition shadow-sm ${
        active
          ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-500 ring-rose-500/30"
          : "bg-white/90 text-zinc-700 border-zinc-200 hover:bg-white dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/15 ring-black/5 dark:ring-white/10"
      } ${busy ? "opacity-70" : ""}`}
      onClick={toggle}
      disabled={on === null}
      title={active ? "Unfavorite" : "Favorite"}
    >
      {active ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21s-6.716-4.243-9.714-7.24C-1.03 12.498.56 7.5 5.143 7.5 7.3 7.5 9.03 8.8 10 10.2 10.97 8.8 12.7 7.5 14.857 7.5 19.44 7.5 21.03 12.498 21.714 13.76 18.716 16.757 12 21 12 21z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12.1 8.64l-.1.1-.1-.1C10.14 6.97 7.3 6.97 5.54 8.72c-1.76 1.76-1.76 4.61 0 6.37L12 21l6.46-5.91c1.76-1.76 1.76-4.61 0-6.37-1.76-1.75-4.6-1.75-6.36 0z" />
        </svg>
      )}
    </button>
  );
}
