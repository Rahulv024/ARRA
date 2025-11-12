import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchRecipes } from "@/server/spoonacular";
import { db } from "@/server/db";

const Q = z.object({
  q: z.string().min(1),
  diet: z.string().optional(),
  cuisine: z.string().optional(),
  maxTime: z.coerce.number().optional(),
  maxCalories: z.coerce.number().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = Q.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const t0 = Date.now();
  let results: any[] = [];
  try {
    results = await searchRecipes({
      query: parsed.data.q,
      diet: parsed.data.diet,
      cuisine: parsed.data.cuisine,
      maxReadyTime: parsed.data.maxTime,
      maxCalories: parsed.data.maxCalories,
    });
    // Enrich with local rating aggregates when available
    try {
      const ids = results.map((r: any) => String(r.id));
      const existing = await db.recipe.findMany({
        where: { id: { in: ids } },
        select: { id: true, avgRating: true, ratingCount: true },
      });
      const map = new Map(existing.map((e) => [e.id, e]));
      results = results.map((r: any) => {
        const m = map.get(String(r.id));
        return m ? { ...r, avgRating: m.avgRating, ratingCount: m.ratingCount } : r;
      });
    } catch {}
  } catch (e: any) {
    // If Spoonacular fails or times out, I fall back to local DB recipes
    const q = parsed.data.q;
    const where: any = {
      title: { contains: q, mode: "insensitive" },
    };
    if (parsed.data.diet) where.diets = { has: parsed.data.diet };
    if (parsed.data.cuisine) where.cuisines = { has: parsed.data.cuisine };
    if (parsed.data.maxTime) where.readyInMinutes = { lte: parsed.data.maxTime };

    try {
      const local = await db.recipe.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          image: true,
          readyInMinutes: true,
          servings: true,
          cuisines: true,
          diets: true,
          avgRating: true,
          ratingCount: true,
        },
      });
      const tookMs = Date.now() - t0;
      try {
        await db.searchLog.create({ data: { query: parsed.data.q, filters: parsed.data, results: local.length, tookMs } });
      } catch {}
      return NextResponse.json({ results: local, tookMs, source: "local" });
    } catch (dbErr: any) {
      const message = e?.message || "Upstream search failed";
      const tookMs = Date.now() - t0;
      try {
        await db.searchLog.create({ data: { query: parsed.data.q, filters: parsed.data, results: 0, tookMs } });
      } catch {}
      return NextResponse.json({ error: message, results: [] }, { status: 502 });
    }
  }
  const tookMs = Date.now() - t0;
  try {
    await db.searchLog.create({
      data: { query: parsed.data.q, filters: parsed.data, results: results.length, tookMs },
    });
  } catch {}

  return NextResponse.json({ results, tookMs });
}
