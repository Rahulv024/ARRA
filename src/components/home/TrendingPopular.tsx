import { trendingRecipes } from "@/server/spoonacular";
import { db } from "@/server/db";
import RecipeGrid from "@/components/search/RecipeGrid";

export default async function TrendingPopular() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [popularRaw, topRated] = await Promise.all([
    trendingRecipes({ number: 12 }).catch(() => [] as any[]),
    db.recipe
      .findMany({
        where: { ratingCount: { gt: 0 }, updatedAt: { gte: oneWeekAgo } },
        orderBy: [{ avgRating: "desc" }, { ratingCount: "desc" }],
        take: 12,
      })
      .catch(() => [] as any[]),
  ]);

  // Map DB recipes to the shape RecipeGrid expects and include aggregates
  const topRatedMapped = topRated.map((r: any) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    servings: r.servings,
    cuisines: r.cuisines,
    diets: r.diets,
    avgRating: r.avgRating,
    ratingCount: r.ratingCount,
  }));

  // Enrich Spoonacular trending with any local aggregates (if these recipes were reviewed)
  let popular = popularRaw as any[];
  if (popular.length) {
    try {
      const ids = popular.map((p: any) => String(p.id));
      const rows = await db.recipe.findMany({
        where: { id: { in: ids } },
        select: { id: true, avgRating: true, ratingCount: true },
      });
      const map = new Map(rows.map((r) => [r.id, r]));
      popular = popular.map((p: any) => {
        const m = map.get(String(p.id));
        return m ? { ...p, avgRating: m.avgRating, ratingCount: m.ratingCount } : p;
      });
    } catch {}
  }

  if (!popular.length && !topRatedMapped.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {topRatedMapped.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Top Rated This Week</h2>
          <RecipeGrid results={topRatedMapped} />
        </div>
      )}

      {popular.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Trending Now</h2>
          <RecipeGrid results={popular} />
        </div>
      )}
    </section>
  );
}
