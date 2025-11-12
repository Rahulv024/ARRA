"use client";
import { useEffect, useState } from "react";

type Item = { id: string; label: string; quantity: number | null; unit: string | null; checked: boolean };
type List = { id: string; name: string; items: Item[] };

export default function ShoppingListPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/shoppinglist", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `Failed ${res.status}`);
      setLists(j.lists || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(item: Item, flag: boolean) {
    const prev = lists.map((l) => ({ ...l, items: l.items.map((it) => (it.id === item.id ? { ...it, checked: flag } : it)) }));
    setLists(prev);
    const res = await fetch("/api/user/shoppinglist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, checked: flag }),
    });
    if (!res.ok) load();
  }

  async function remove(item: Item) {
    const prev = lists.map((l) => ({ ...l, items: l.items.filter((it) => it.id !== item.id) }));
    setLists(prev);
    const res = await fetch(`/api/user/shoppinglist?itemId=${item.id}`, { method: "DELETE" });
    if (!res.ok) load();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Shopping list</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Ingredients you’ve added from recipes.</p>
      </header>

      {loading && <div className="card p-6 animate-pulse">Loading...</div>}
      {error && <div className="card p-4 text-rose-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-6">
          {lists.length === 0 && <div className="text-sm text-zinc-600">No lists yet. Add from any recipe page.</div>}
          {lists.map((list) => (
            <section key={list.id} className="rounded-2xl border p-4 shadow-sm dark:border-zinc-800 transition">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{list.name}</h2>
                <button
                  className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-transform hover:scale-[1.02]"
                  onClick={async () => {
                    if (!confirm("Remove this whole list?")) return;
                    const prev = lists.filter((l) => l.id !== list.id);
                    setLists(prev);
                    const res = await fetch(`/api/user/shoppinglist?listId=${list.id}`, { method: "DELETE" });
                    if (!res.ok) load();
                  }}
                >
                  Remove list
                </button>
              </div>
              <ul className="divide-y dark:divide-zinc-800">
                {list.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 py-2 group">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        checked={it.checked}
                        onChange={(e) => toggle(it, e.target.checked)}
                      />
                      <span className={`text-sm ${it.checked ? "line-through text-zinc-400" : ""}`}>
                        {it.label}
                        {it.quantity ? ` — ${it.quantity}${it.unit ? ` ${it.unit}` : ""}` : ""}
                      </span>
                    </label>
                    <button className="btn opacity-0 group-hover:opacity-100 transition" onClick={() => remove(it)}>Remove</button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}


