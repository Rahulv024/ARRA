/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import ReviewsSection from "@/components/sheet/ReviewsSection";
import SubstituteBox from "@/components/sheet/SubstituteBox";
import AddToListButton from "@/components/shopping/AddToListButton";
import { recipeDetails, recipePriceBreakdown } from "@/server/spoonacular";
import { db } from "@/server/db";
import RelatedRecipes from "@/components/recipe/RelatedRecipes";

async function getDetails(id: string) {
  try {
    return await recipeDetails(Number(id));
  } catch {
    return null;
  }
}

async function getPrice(id: string) {
  try {
    return await recipePriceBreakdown(Number(id));
  } catch {
    return null;
  }
}

export default async function RecipePage({ params }: { params: { id: string } }) {
  // I try the local DB first for fast rendering
  const local = await db.recipe.findUnique({ where: { id: params.id } }).catch(() => null);

  let details: any = null;
  let price: any = null;

  if (local) {
    // I build a details-like object from the DB fields for rendering
    const extendedIngredients = Array.isArray(local.ingredients)
      ? (local.ingredients as any[])
      : [];
    // Normalize steps from DB: may be an array of strings OR already Spoonacular-shaped objects
    let analyzedInstructions: any[] = [];
    let stepsArray: string[] = [];
    if (Array.isArray(local.steps)) {
      const arr = local.steps as any[];
      const first = arr[0];
      if (first && typeof first === "object" && "steps" in first) {
        // Already in analyzedInstructions format; use as-is
        analyzedInstructions = arr as any[];
      } else {
        // Treat as array of plain strings
        stepsArray = arr.map((s) => String(s));
        analyzedInstructions = stepsArray.length
          ? [{ steps: stepsArray.map((s, i) => ({ number: i + 1, step: s })) }]
          : [];
      }
    }

    details = {
      id: local.id,
      title: local.title,
      image: local.image,
      readyInMinutes: local.readyInMinutes,
      servings: local.servings,
      cuisines: local.cuisines || [],
      diets: local.diets || [],
      extendedIngredients,
      analyzedInstructions,
      instructions: stepsArray.length ? stepsArray.join("\n") : null,
      sourceUrl: local.sourceUrl || null,
      spoonacularId: local.spoonacularId || null,
      nutrition: local.nutrition || null,
    };

    // I only fetch the Spoonacular price if I have a numeric upstream id
    if (typeof local.spoonacularId === "number") {
      try {
        price = await recipePriceBreakdown(local.spoonacularId);
      } catch {}
    }
  } else {
    // Otherwise I fall back to upstream details using the numeric id in the URL
    const numId = Number(params.id);
    if (!Number.isFinite(numId)) notFound();
    [details, price] = await Promise.all([getDetails(params.id), getPrice(params.id)]);
  }
  if (!details) notFound();

  const steps: string[] =
    details?.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ??
    (details?.instructions ? [details.instructions] : []);

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="card overflow-hidden border-0">
        <div className="relative">
          <img src={details.image} alt={details.title} className="w-full h-72 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent dark:from-zinc-950" />
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{details.title}</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {details.readyInMinutes ? `${details.readyInMinutes} min` : ""}
                {details.servings ? ` • ${details.servings} servings` : ""}
                {details.cuisines?.[0] ? ` • ${details.cuisines[0]}` : ""}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {details?.sourceUrl ? (
                <a className="btn" href={details.sourceUrl} target="_blank" rel="noreferrer">Original</a>
              ) : details?.spoonacularId ? (
                <a
                  className="btn"
                  href={`https://spoonacular.com/recipes/${encodeURIComponent(details.title)}-${details.spoonacularId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original
                </a>
              ) : null}
              <AddToListButton
                ingredients={details.extendedIngredients || []}
                recipeTitle={details.title}
              />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Ingredients</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {details.extendedIngredients?.map((ing: any) => (
                <div
                  key={ing.id ?? ing.name}
                  className="rounded-xl border px-3 py-2 text-sm dark:border-zinc-800"
                >
                  {ing.original}
                </div>
              ))}
            </div>
          </div>

          {!!steps.length && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Steps</h2>
              <ol className="space-y-2">
                {steps.map((s: string, idx: number) => (
                  <li key={idx} className="rounded-xl border px-3 py-2 text-sm dark:border-zinc-800">
                    <span className="font-medium mr-2">{idx + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* I show AI substitutions */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Ingredient substitutions</h2>
            <SubstituteBox recipe={details} />
          </div>

          {details.nutrition?.nutrients && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Nutrition (per serving)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const n = details.nutrition.nutrients as Array<{
                    name: string;
                    amount: number;
                    unit: string;
                  }>;
                  const wanted = ["Calories", "Protein", "Fat", "Carbohydrates"];
                  const map: Record<string, { name: string; amount: number; unit: string } | undefined> = {};
                  for (const x of n) if (wanted.includes(x.name)) map[x.name] = x as any;
                  return wanted.map((name) => {
                    const it = map[name];
                    return (
                      <div key={name} className="rounded-2xl border p-3 text-sm dark:border-zinc-800">
                        <div className="text-zinc-500">{name}</div>
                        <div className="mt-1 text-base font-semibold">
                          {it ? `${Math.round(it.amount)} ${it.unit}` : "-"}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {price?.ingredients && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Price breakdown</h2>
              <div className="rounded-2xl border dark:border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {price.ingredients.slice(0, 20).map((ing: any, i: number) => {
                    const cents = typeof price.totalCost === "number" && price.totalCost > 100;
                    const toUSD = (v: number) => (cents ? v / 100 : v);
                    const us = ing.amount?.us || ing.amount?.metric || {};
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2 border-t sm:border-l-0 first:border-t-0 dark:border-zinc-800"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{ing.name}</div>
                          {us?.value && us?.unit && (
                            <div className="text-xs text-zinc-500">
                              {us.value} {us.unit}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium">${toUSD(ing.price).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                {typeof price.totalCost === "number" && (
                  <div className="flex items-center justify-between px-4 py-3 border-t dark:border-zinc-800">
                    {(() => {
                      const cents = price.totalCost > 100;
                      const toUSD = (v: number) => (cents ? v / 100 : v);
                      const total = toUSD(price.totalCost);
                      const per = price.servings ? total / price.servings : undefined;
                      return (
                        <>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">Servings: {price.servings ?? "-"}</div>
                          <div className="text-sm font-semibold">
                            Total: ${total.toFixed(2)}{per ? ` • $${per.toFixed(2)} per serving` : ""}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* I render Reviews */}
          <ReviewsSection recipeId={String(details.id)} />

          {/* I suggest Related recipes */}
          <RelatedRecipes recipe={details} />
        </div>
      </div>
    </section>
  );
}
