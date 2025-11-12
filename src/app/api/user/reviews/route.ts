import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import { recipeDetails } from "@/server/spoonacular";

// I return reviews and aggregates on GET /api/reviews?recipeId=RID
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const recipeId = url.searchParams.get("recipeId") || "";
  if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

  const [reviews, agg] = await Promise.all([
    db.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    }),
    db.review.aggregate({ where: { recipeId }, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  const my = session?.user?.id
    ? await db.review.findFirst({ where: { recipeId, userId: (session.user as any).id } })
    : null;

  // I also reflect aggregates into the Recipe row for faster reads elsewhere
  await db.recipe.updateMany({
    where: { id: recipeId },
    data: { avgRating: agg._avg.rating || 0, ratingCount: agg._count._all || 0 },
  });

  return NextResponse.json({
    reviews,
    avg: agg._avg.rating || 0,
    count: agg._count._all || 0,
    myReview: my || null,
  });
}

// I upsert the user’s review on POST /api/reviews  { recipeId, rating, comment }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const recipeId = String(body?.recipeId || "");
  const rating = Number(body?.rating || 0);
  const comment = (body?.comment || "").toString().slice(0, 1000);

  if (!recipeId || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  // I ensure the Recipe exists first (FK constraint)
  try {
    const existingRecipe = await db.recipe.findUnique({ where: { id: recipeId } });
    if (!existingRecipe) {
      const idNum = parseInt(recipeId, 10);
      if (!Number.isNaN(idNum)) {
        try {
          const d = await recipeDetails(idNum);
          await db.recipe.upsert({
            where: { id: recipeId },
            create: {
              id: recipeId,
              spoonacularId: idNum,
              title: d?.title ?? `Recipe ${recipeId}`,
              summary: d?.summary ?? null,
              image: d?.image ?? null,
              sourceUrl: d?.sourceUrl ?? null,
              readyInMinutes: d?.readyInMinutes ?? null,
              servings: d?.servings ?? null,
              cuisines: Array.isArray(d?.cuisines) ? d.cuisines : [],
              diets: Array.isArray(d?.diets) ? d.diets : [],
              ingredients: d?.extendedIngredients ?? null,
              steps: d?.analyzedInstructions ?? null,
              nutrition: d?.nutrition ?? null,
            },
            update: {
              title: d?.title ?? `Recipe ${recipeId}`,
              image: d?.image ?? null,
              sourceUrl: d?.sourceUrl ?? null,
            },
          });
        } catch {
          await db.recipe.create({
            data: { id: recipeId, title: `Recipe ${recipeId}`, cuisines: [], diets: [] },
          });
        }
      } else {
        await db.recipe.create({ data: { id: recipeId, title: `Recipe ${recipeId}`, cuisines: [], diets: [] } });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "failed to ensure recipe" }, { status: 500 });
  }

  // I upsert the review (schema has no @@unique on userId+recipeId)
  const existing = await db.review.findFirst({ where: { recipeId, userId: (session.user as any).id } });
  if (existing) {
    await db.review.update({ where: { id: existing.id }, data: { rating, comment } });
  } else {
    await db.review.create({ data: { recipeId, userId: (session.user as any).id, rating, comment } });
  }

  // I refresh aggregates and push them to the Recipe row
  const agg = await db.review.aggregate({ where: { recipeId }, _avg: { rating: true }, _count: { _all: true } });
  await db.recipe.updateMany({
    where: { id: recipeId },
    data: { avgRating: agg._avg.rating || 0, ratingCount: agg._count._all || 0 },
  });

  const [reviews, my] = await Promise.all([
    db.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    }),
    db.review.findFirst({ where: { recipeId, userId: (session.user as any).id } }),
  ]);

  return NextResponse.json({
    ok: true,
    reviews,
    avg: agg._avg.rating || 0,
    count: agg._count._all || 0,
    myReview: my || null,
  });
}
