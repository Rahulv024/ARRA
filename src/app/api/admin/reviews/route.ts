import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null as any;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { id: true, email: true } }, recipe: { select: { id: true, title: true } } },
  });
  return NextResponse.json({ reviews });
}
