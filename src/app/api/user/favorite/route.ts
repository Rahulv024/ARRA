import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

// I support two read patterns on GET /api/user/favorite:
// - With ?recipeId=123 I tell you { favorited: boolean }
// - Without it I return your favorites list (including recipe records)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const recipeId = url.searchParams.get("recipeId");

  if (!session?.user?.id) {
    return NextResponse.json(recipeId ? { favorited: false } : { favorites: [] }, { status: 200 });
  }

  if (recipeId) {
    const fav = await db.favorite.findFirst({
      where: { userId: (session.user as any).id, recipeId: String(recipeId) },
      select: { id: true },
    });
    return NextResponse.json({ favorited: !!fav });
  }

  const favorites = await db.favorite.findMany({
    where: { userId: (session.user as any).id },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

// On POST /api/user/favorite I toggle a favorite { recipeId, recipe }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const userId = (session.user as any).id as string;
  const rid = String(body?.recipeId || "");
  const recipe = body?.recipe as any;

  if (!rid) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

  // I perform a toggle here
  const existing = await db.favorite.findFirst({ where: { userId, recipeId: rid } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  // I also ensure a Recipe record exists so other pages can render from the local DB
  if (recipe) {
    await db.recipe.upsert({
      where: { id: rid },
      create: {
        id: rid,
        title: recipe.title ?? "",
        image: recipe.image ?? null,
        spoonacularId: typeof recipe.id === "number" ? recipe.id : parseInt(rid, 10) || null,
        readyInMinutes: recipe.readyInMinutes ?? null,
        servings: recipe.servings ?? null,
        cuisines: Array.isArray(recipe.cuisines) ? recipe.cuisines : [],
        diets: Array.isArray(recipe.diets) ? recipe.diets : [],
        sourceUrl: recipe.sourceUrl ?? null,
      },
      update: {
        title: recipe.title ?? "",
        image: recipe.image ?? null,
        spoonacularId: typeof recipe.id === "number" ? recipe.id : parseInt(rid, 10) || null,
        readyInMinutes: recipe.readyInMinutes ?? null,
        servings: recipe.servings ?? null,
        cuisines: Array.isArray(recipe.cuisines) ? recipe.cuisines : [],
        diets: Array.isArray(recipe.diets) ? recipe.diets : [],
        sourceUrl: recipe.sourceUrl ?? null,
      },
    });
  }

  await db.favorite.create({ data: { userId, recipeId: rid } });
  return NextResponse.json({ favorited: true });
}
