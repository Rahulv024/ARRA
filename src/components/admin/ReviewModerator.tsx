"use client";

import { useEffect, useState } from "react";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; email: string | null };
  recipe: { id: string; title: string | null };
};

export default function ReviewModerator() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/reviews", { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) { setError(j?.error || "Failed to load reviews"); setLoading(false); return; }
    setRows(j.reviews || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const prev = rows.slice();
    setRows((r) => r.filter((x) => x.id !== id));
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) { setRows(prev); alert("Failed to delete"); }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent reviews</h2>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/40">
            <tr className="text-left">
              <th className="px-3 py-2">Recipe</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Comment</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={5}>Loading…</td></tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="border-top border-t dark:border-zinc-800">
                  <td className="px-3 py-2 truncate max-w-[200px]"><a className="underline" href={`/recipe/${r.recipe.id}`} target="_blank">{r.recipe.title || r.recipe.id}</a></td>
                  <td className="px-3 py-2">{r.user.email || r.user.id}</td>
                  <td className="px-3 py-2">{r.rating}★</td>
                  <td className="px-3 py-2 truncate max-w-[360px]">{r.comment || "—"}</td>
                  <td className="px-3 py-2"><button className="btn text-rose-600" onClick={() => remove(r.id)}>Delete</button></td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-3" colSpan={5}>No reviews</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </section>
  );
}

