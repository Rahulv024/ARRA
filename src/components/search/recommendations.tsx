"use client";

import { useQuery } from "@tanstack/react-query";
import RecipeGrid from "./RecipeGrid";

type RecsResponse = { results: any[] };

export default function Recommendations(props: {
  q: string;
  diet?: string;
  cuisine?: string;
  maxTime?: number;
}) {
  const { q, diet, cuisine, maxTime } = props;

  const { data, isFetching } = useQuery<RecsResponse>({
    queryKey: ["recs", q, diet, cuisine, maxTime],
    queryFn: async () => {
      const p = new URLSearchParams({
        q,
        ...(diet ? { diet } : {}),
        ...(cuisine ? { cuisine } : {}),
        ...(maxTime ? { maxTime: String(maxTime) } : {}),
      });
      const res = await fetch(`/api/recommendations?${p.toString()}`, { cache: "no-store" });
      if (!res.ok) return { results: [] };
      return res.json();
    },
  });

  const results = data?.results ?? [];

  if (isFetching && results.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Recommended</h2>
        <div className="text-sm text-zinc-600">Finding great ideas...</div>
      </section>
    );
  }

  if (!results.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Recommended</h2>
      <RecipeGrid results={results} />
    </section>
  );
}

