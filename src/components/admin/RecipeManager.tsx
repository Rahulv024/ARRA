"use client";

import { useEffect, useState } from "react";

type Recipe = {
  id: string;
  title: string;
  image?: string | null;
  spoonacularId?: number | null;
  readyInMinutes?: number | null;
  servings?: number | null;
  cuisines: string[];
  diets: string[];
  sourceUrl?: string | null;
};

export default function RecipeManager() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Recipe | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/recipes?q=${encodeURIComponent(q)}&take=50`, { cache: "no-store" });
    const j = await res.json();
    if (res.ok) {
      setItems(j.items || []);
      setTotal(j.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // capture the form before any awaits to avoid React event nulling
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const ingredientsText = (fd.get("ingredients") || "").toString();
    const stepsText = (fd.get("steps") || "").toString();
    const ingredientsArr = ingredientsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => ({ name: line, original: line }));
    const stepsArr = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const doc: any = {
      title: (fd.get("title") || "").toString(),
      image: (fd.get("image") || "").toString() || null,
      sourceUrl: (fd.get("sourceUrl") || "").toString() || null,
      spoonacularId: Number(fd.get("spoonacularId") || "") || null,
      readyInMinutes: Number(fd.get("readyInMinutes") || "") || null,
      servings: Number(fd.get("servings") || "") || null,
      cuisines: (fd.get("cuisines") || "").toString().split(",").map((s) => s.trim()).filter(Boolean),
      diets: (fd.get("diets") || "").toString().split(",").map((s) => s.trim()).filter(Boolean),
      ingredients: ingredientsArr.length ? ingredientsArr : null,
      steps: stepsArr.length ? stepsArr : null,
    };
    if (!doc.title) { alert("Title required"); return; }
    const res = await fetch("/api/admin/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) });
    if (!res.ok) { const j = await res.json(); alert(j.error || "Create failed"); return; }
    // safely reset the form
    form.reset();
    await load();
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch("/api/admin/recipes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    if (!res.ok) { const j = await res.json(); alert(j.error || "Update failed"); return; }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this recipe? This will remove its favorites and reviews.")) return;
    const res = await fetch(`/api/admin/recipes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); alert(j.error || "Delete failed"); return; }
    load();
  }

  const editingId = editing?.id;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Recipes</h2>

      <div className="flex gap-2">
        <input className="input w-64" placeholder="Search recipes..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading..." : "Search"}</button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/40">
            <tr className="text-left">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Spoonacular</th>
              <th className="px-3 py-2">Time/Serv.</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td className="px-3 py-3" colSpan={5}>No recipes</td></tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="border-t dark:border-zinc-800 align-top">
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <>
                      <input className="input w-full mb-1" value={editing!.title} onChange={(e) => setEditing((prev) => prev ? { ...prev, title: e.target.value } : prev)} />
                      <input className="input w-full mb-1" placeholder="Image URL" value={editing!.image || ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, image: e.target.value } : prev)} />
                      <input className="input w-full" placeholder="Source URL" value={editing!.sourceUrl || ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, sourceUrl: e.target.value } : prev)} />
                    </>
                  ) : (
                    <>
                      <div className="font-medium">{r.title}</div>
                      {r.image && <div className="text-xs text-zinc-500 truncate">{r.image}</div>}
                    </>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <input className="input w-28" type="number" value={editing!.spoonacularId ?? ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, spoonacularId: e.target.value ? Number(e.target.value) : null } : prev)} />
                  ) : (r.spoonacularId ?? "-")}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <div className="flex gap-1">
                      <input className="input w-20" type="number" placeholder="mins" value={editing!.readyInMinutes ?? ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, readyInMinutes: e.target.value ? Number(e.target.value) : null } : prev)} />
                      <input className="input w-20" type="number" placeholder="serv" value={editing!.servings ?? ""} onChange={(e) => setEditing((prev) => prev ? { ...prev, servings: e.target.value ? Number(e.target.value) : null } : prev)} />
                    </div>
                  ) : (
                    <>
                      <div>{r.readyInMinutes ?? "-"} min</div>
                      <div>{r.servings ?? "-"} servings</div>
                    </>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <>
                      <input className="input w-full mb-1" placeholder="cuisines (comma sep)" value={(editing!.cuisines || []).join(", ")} onChange={(e) => setEditing((prev) => prev ? { ...prev, cuisines: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } : prev)} />
                      <input className="input w-full" placeholder="diets (comma sep)" value={(editing!.diets || []).join(", ")} onChange={(e) => setEditing((prev) => prev ? { ...prev, diets: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } : prev)} />
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1">{(r.cuisines || []).map((c) => <span key={c} className="badge">{c}</span>)}</div>
                      <div className="mt-1 flex flex-wrap gap-1">{(r.diets || []).map((d) => <span key={d} className="badge">{d}</span>)}</div>
                    </>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <button className="btn primary" onClick={saveEdit}>Save</button>
                      <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="btn" onClick={() => setEditing(r)}>Edit</button>
                      <button className="btn text-rose-600" onClick={() => remove(r.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card p-4 space-y-2" onSubmit={create}>
        <div className="text-sm font-medium">Create new recipe</div>
        <input className="input" name="title" placeholder="Title" required />
        <div className="grid sm:grid-cols-2 gap-2">
          <input className="input" name="image" placeholder="Image URL" />
          <input className="input" name="sourceUrl" placeholder="Source URL" />
          <input className="input" name="spoonacularId" placeholder="Spoonacular ID (optional)" inputMode="numeric" />
          <input className="input" name="readyInMinutes" placeholder="Minutes" inputMode="numeric" />
          <input className="input" name="servings" placeholder="Servings" inputMode="numeric" />
          <input className="input" name="cuisines" placeholder="Cuisines (comma separated)" />
          <input className="input" name="diets" placeholder="Diets (comma separated)" />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <textarea className="input h-28" name="ingredients" placeholder="Ingredients (one per line) e.g.\n2 cups basmati rice\n1/2 tsp turmeric"></textarea>
          <textarea className="input h-28" name="steps" placeholder="Steps (one per line) e.g.\nRinse and soak rice 30 min\nMarinate chicken 1 hr"></textarea>
        </div>
        <div><button className="btn primary" type="submit">Create</button></div>
      </form>
    </section>
  );
}
