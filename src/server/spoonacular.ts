const BASE = "https://api.spoonacular.com";
const PRIMARY_KEY = process.env.SPOONACULAR_API_KEY!;
const FALLBACK_KEY = process.env.SPOONACULAR_API_KEY_FALLBACK;

// Fetch with automatic fallback to a secondary Spoonacular key on rate limit.
async function fetchWithFallback(buildUrl: (key: string) => string, init?: RequestInit) {
  // First try primary key
  let res = await fetch(buildUrl(PRIMARY_KEY), { cache: "no-store", ...(init ?? {}) });
  // Spoonacular typically responds with 402 or 429 when out of quota; include 403 as some tiers use it.
  if ((res.status === 402 || res.status === 429 || res.status === 403) && FALLBACK_KEY) {
    const retry = await fetch(buildUrl(FALLBACK_KEY), { cache: "no-store", ...(init ?? {}) });
    res = retry;
  }
  return res;
}

export async function searchRecipes({
  query, diet, cuisine, maxReadyTime, maxCalories, number = 24,
}: {
  query: string; diet?: string; cuisine?: string; maxReadyTime?: number; maxCalories?: number; number?: number;
}) {
  const params = new URLSearchParams({
    query,
    number: String(number),
    addRecipeInformation: "true",
    fillIngredients: "true",
    instructionsRequired: "true",
  });
  if (diet) params.set("diet", diet);
  if (cuisine) params.set("cuisine", cuisine);
  if (maxReadyTime) params.set("maxReadyTime", String(maxReadyTime));
  if (maxCalories) params.set("maxCalories", String(maxCalories));

  const res = await fetchWithFallback((key) => `${BASE}/recipes/complexSearch?${params.toString()}&apiKey=${key}`);
  if (!res.ok) throw new Error("Spoonacular search failed");
  const data = await res.json();
  return data.results;
}

// I fetch popular/trending recipes using Spoonacular's popularity sorting
export async function trendingRecipes({
  number = 12, diet, cuisine,
}: { number?: number; diet?: string; cuisine?: string }) {
  const params = new URLSearchParams({
    number: String(number),
    addRecipeInformation: "true",
    fillIngredients: "true",
    instructionsRequired: "true",
    sort: "popularity",
    sortDirection: "desc",
  });
  if (diet) params.set("diet", diet);
  if (cuisine) params.set("cuisine", cuisine);
  const res = await fetchWithFallback((key) => `${BASE}/recipes/complexSearch?${params.toString()}&apiKey=${key}`);
  if (!res.ok) throw new Error("Spoonacular trending failed");
  const data = await res.json();
  return data.results;
}

export async function recipeDetails(id: number) {
  const res = await fetchWithFallback((key) => `${BASE}/recipes/${id}/information?apiKey=${key}&includeNutrition=true`);
  if (!res.ok) throw new Error("Spoonacular details failed");
  return res.json();
}

export async function recipePriceBreakdown(id: number) {
  const res = await fetchWithFallback((key) => `${BASE}/recipes/${id}/priceBreakdownWidget.json?apiKey=${key}`);
  if (!res.ok) throw new Error("Spoonacular price breakdown failed");
  return res.json();
}

// I fetch Spoonacular's similar recipes and then hydrate details so I include images
export async function similarRecipesDetailed(id: number, number: number = 4) {
  const simRes = await fetchWithFallback((key) => `${BASE}/recipes/${id}/similar?apiKey=${key}&number=${number}`);
  if (!simRes.ok) throw new Error("Spoonacular similar failed");
  const sims: Array<{ id: number; title: string; readyInMinutes?: number; servings?: number }> = await simRes.json();
  const hydrated = await Promise.allSettled(sims.map((s) => recipeDetails(s.id)));
  const items: any[] = [];
  for (const h of hydrated) {
    if (h.status === "fulfilled") {
      const d = h.value as any;
      items.push({
        id: d.id,
        title: d.title,
        image: d.image,
        readyInMinutes: d.readyInMinutes,
        servings: d.servings,
        cuisines: d.cuisines ?? [],
        diets: d.diets ?? [],
      });
    }
  }
  return items.slice(0, number);
}
