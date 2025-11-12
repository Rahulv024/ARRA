import { db } from "@/server/db";
export const dynamic = "force-dynamic"; // avoid prerendering DB calls on Vercel
export const revalidate = 0;
import nextDynamic from "next/dynamic";

const UserManager = nextDynamic(() => import("@/components/admin/UserManager"), { ssr: false });
const ReviewModerator = nextDynamic(() => import("@/components/admin/ReviewModerator"), { ssr: false });
const RecipeManager = nextDynamic(() => import("@/components/admin/RecipeManager"), { ssr: false });

export default async function AdminPage() {
  const [searches, recipes] = await Promise.all([
    db.searchLog.count(),
    db.recipe.count(),
  ]);

  const avgAgg = await db.recipe.aggregate({ _avg: { avgRating: true } });
  const avg = avgAgg._avg.avgRating;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage users and moderate reviews.</p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4"><div>Total Searches</div><div className="text-2xl font-bold">{searches}</div></div>
        <div className="rounded-xl border p-4"><div>Recipes Cached</div><div className="text-2xl font-bold">{recipes}</div></div>
        <div className="rounded-xl border p-4"><div>Avg Rating</div><div className="text-2xl font-bold">{avg?.toFixed(2) ?? "-"}</div></div>
      </section>

      <UserManager />
      <ReviewModerator />
      <RecipeManager />
    </main>
  );
}
