"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import ReviewsSection from "./ReviewsSection";

export default function RecipeModal({
  recipe,
  onClose,
}: {
  recipe: any; // Spoonacular recipe object (id, title, image, etc.)
  onClose: () => void;
}) {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const key = process.env.NEXT_PUBLIC_SPOONACULAR_KEY || process.env.SPOONACULAR_API_KEY;
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=false&apiKey=${key}`,
          { cache: "no-store" }
        );
        if (alive) setDetails(res.ok ? await res.json() : recipe);
      } catch {
        if (alive) setDetails(recipe);
      }
    })();
    return () => {
      alive = false;
    };
  }, [recipe]);

  const steps =
    details?.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ??
    (details?.instructions ? [details.instructions] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="card max-w-3xl w-full overflow-hidden">
        <div className="relative">
          <img src={details?.image || recipe.image} alt={details?.title || recipe.title} className="w-full h-64 object-cover" />
          <button className="btn absolute top-3 right-3" onClick={onClose}>Close</button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold tracking-tight">{details?.title || recipe.title}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {details?.readyInMinutes ?? recipe.readyInMinutes ? `${details?.readyInMinutes ?? recipe.readyInMinutes} min` : ""}{" "}
            {details?.servings ?? recipe.servings ? `• ${details?.servings ?? recipe.servings} servings` : ""}{" "}
            {details?.cuisines?.[0] ?? recipe.cuisines?.[0] ? `• ${(details?.cuisines?.[0] ?? recipe.cuisines?.[0])}` : ""}
          </p>

          {/* Ingredients */}
          {details?.extendedIngredients?.length ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {details.extendedIngredients.map((ing: any) => (
                  <div key={ing.id ?? ing.original} className="rounded-xl border px-3 py-2 text-sm dark:border-zinc-800">
                    {ing.original}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Steps */}
          {steps?.length ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Steps</h3>
              <ol className="space-y-2">
                {steps.map((s: string, i: number) => (
                  <li key={i} className="rounded-xl border px-3 py-2 text-sm dark:border-zinc-800">
                    <span className="font-medium mr-2">{i + 1}.</span>{s}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* Reviews — NOTE: pass recipeId, not recipe */}
          <ReviewsSection recipeId={String(recipe.id)} />
        </div>
      </div>
    </div>
  );
}
