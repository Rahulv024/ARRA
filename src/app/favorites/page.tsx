import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";
import RecipeGrid from "@/components/search/RecipeGrid";

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Favorites</h1>
        <p className="text-zinc-600">Please sign in to see your favorites.</p>
      </section>
    );
  }

  const rows = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((r) => r.recipe);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Your favorites</h1>
      {items.length ? (
        <RecipeGrid results={items} />
      ) : (
        <p className="text-zinc-600">No favorites yet. Start exploring and tap the ♥ icon to save recipes.</p>
      )}
    </section>
  );
}
