"use client";
import { useState } from "react";

export default function SubstituteBox({ recipe }: { recipe: any }) {
  const [missing, setMissing] = useState("");
  const [out, setOut] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  const go = async () => {
    if (!missing.trim()) return;
    setBusy(true);
    setErr(null);
    setOut(null);
    setSource(null);
    try {
      const res = await fetch("/api/ai/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missing,
          ingredients: recipe?.ingredients ?? recipe?.extendedIngredients ?? [],
          diet: recipe?.diets?.join(", ") || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j?.error || `Failed (${res.status})`);
        return;
      }
      setOut(j.suggestions || []);
      setSource(j.source || null);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-3 space-y-3">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="e.g., coconut cream"
          value={missing}
          onChange={(e) => setMissing(e.target.value)}
          disabled={busy}
        />
        <button className="btn" onClick={go} disabled={busy || !missing.trim()}>
          {busy ? "Thinking..." : "Suggest"}
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {out && (
        <ul className="space-y-2 text-sm animate-fade-in">
          {/* I intentionally hide the raw source; I only surface suggestions */}
          {out.map((s, i) => (
            <li
              key={i}
              className="opacity-0 rounded-xl border px-3 py-2 bg-zinc-50 dark:bg-zinc-900/30 dark:border-zinc-800 animate-fade-slide-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="font-medium">{s.for}</span>
              <span className="mx-1 text-zinc-400">—</span>
              <span className="text-emerald-700 dark:text-emerald-400">{s.alt}</span>
              {s.note ? <span className="text-zinc-600 dark:text-zinc-400"> - {s.note}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
