import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rev = await db.review.findUnique({ where: { id: params.id } });
  if (!rev) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.review.delete({ where: { id: params.id } });

  // refresh aggregates for the recipe
  const agg = await db.review.aggregate({ where: { recipeId: rev.recipeId }, _avg: { rating: true }, _count: { _all: true } });
  await db.recipe.updateMany({
    where: { id: rev.recipeId },
    data: { avgRating: agg._avg.rating || 0, ratingCount: agg._count._all || 0 },
  });

  return NextResponse.json({ ok: true });
}
