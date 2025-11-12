"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RecipeGrid from "./RecipeGrid";

export default function SearchSection() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<{ diet?: string; cuisine?: string; maxTime?: number; maxCalories?: number }>({});

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["search", q, filters],
    enabled: false,
    queryFn: async () => {
      const params = new URLSearchParams({
        q,
        ...(filters.diet ? { diet: filters.diet } : {}),
        ...(filters.cuisine ? { cuisine: filters.cuisine } : {}),
        ...(filters.maxTime ? { maxTime: String(filters.maxTime) } : {}),
        ...(filters.maxCalories ? { maxCalories: String(filters.maxCalories) } : {}),
      });
      const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      localStorage.setItem("lastSearch", JSON.stringify({ q, filters }));
      return json;
    },
  });

  const results: any[] = useMemo(() => data?.results || [], [data]);

  const search = () => {
    if (!q.trim()) return;
    refetch();
  };

  useEffect(() => {
    setQ(""); // I start with an empty query to invite typing
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold tracking-tight mb-2">Welcome, start exploring</h2>
      <p className="text-sm text-zinc-600 mb-4">Find great recipes, filter by diet and cuisine, and build your shopping list.</p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input flex-1 min-w-[260px]"
          placeholder={`Try: "easy low-carb lunch under 15 minutes"`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-40" value={filters.diet || ""} onChange={(e) => setFilters((f) => ({ ...f, diet: e.target.value || undefined }))}>
          <option value="">Diet</option>
          <option value="vegan">Vegan</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="keto">Keto</option>
          <option value="gluten free">Gluten free</option>
        </select>
        <select className="input w-40" value={filters.cuisine || ""} onChange={(e) => setFilters((f) => ({ ...f, cuisine: e.target.value || undefined }))}>
          <option value="">Cuisine</option>
          <option value="indian">Indian</option>
          <option value="italian">Italian</option>
          <option value="mexican">Mexican</option>
          <option value="thai">Thai</option>
        </select>
        <input className="input w-28" placeholder="Max min" inputMode="numeric"
               onChange={(e) => setFilters((f) => ({ ...f, maxTime: e.target.value ? Number(e.target.value) : undefined }))}/>
        <input className="input w-28" placeholder="Max kcal" inputMode="numeric"
               onChange={(e) => setFilters((f) => ({ ...f, maxCalories: e.target.value ? Number(e.target.value) : undefined }))}/>
        <button className="btn primary" onClick={search} disabled={isFetching}>{isFetching ? "Searching…" : "Search"}</button>
      </div>

      <div className="mt-6 animate-in fade-in-50">
        {isFetching && (
          <div className="grid-cards">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse" />
            ))}
          </div>
        )}

        {!isFetching && results.length > 0 && (
          <RecipeGrid results={results} onView={() => {}} />
        )}

        {!isFetching && results.length === 0 && (
          <div className="text-sm text-zinc-600">Start by searching for something tasty.</div>
        )}
      </div>
    </section>
  );
}
