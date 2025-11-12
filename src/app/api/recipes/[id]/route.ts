import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { recipeDetails } from "@/server/spoonacular";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const cached = await db.recipe.findUnique({ where: { spoonacularId: id } });
  if (cached) return NextResponse.json(cached);

  const d = await recipeDetails(id);
  const saved = await db.recipe.create({
    data: {
      id: String(id),
      spoonacularId: id,
      title: d.title,
      summary: d.summary,
      image: d.image,
      sourceUrl: d.sourceUrl,
      readyInMinutes: d.readyInMinutes,
      servings: d.servings,
      cuisines: d.cuisines ?? [],
      diets: d.diets ?? [],
      ingredients: d.extendedIngredients,
      steps: d.analyzedInstructions,
      nutrition: d.nutrition,
    },
  });
  return NextResponse.json(saved);
}
