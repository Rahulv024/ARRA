import RecipeGrid from "@/components/search/RecipeGrid";
import { searchRecipes } from "@/server/spoonacular";

const INGREDIENTS = [
  "chicken",
  "lentils",
  "salmon",
  "tofu",
  "mushroom",
  "eggplant",
  "potato",
  "chickpeas",
  "spinach",
  "bell pepper",
  "tomato",
  "paneer",
];

function pickFeatured(): string {
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return INGREDIENTS[day % INGREDIENTS.length];
}

export default async function IngredientSpotlight() {
  const featured = pickFeatured();
  let results: any[] = [];
  try {
    results = await searchRecipes({ query: featured, number: 4 });
  } catch {}
  if (!results.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Ingredient spotlight: {featured}</h2>
      <RecipeGrid results={results} />
    </section>
  );
}

