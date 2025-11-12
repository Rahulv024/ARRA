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
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const body = (await req.json().catch(() => null)) as { userId?: string; role?: "ADMIN" | "USER" };
  if (!body?.userId || (body.role !== "ADMIN" && body.role !== "USER")) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const updated = await db.user.update({ where: { id: body.userId }, data: { role: body.role } });
  return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role } });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const qId = url.searchParams.get("userId");
  const body = (await req.json().catch(() => ({} as any))) as { userId?: string };
  const userId = String(body?.userId || qId || "");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    const lists = await db.shoppingList.findMany({ where: { userId }, select: { id: true } });
    const listIds = lists.map((l) => l.id);
    if (listIds.length) await db.shoppingItem.deleteMany({ where: { listId: { in: listIds } } });
    await db.shoppingList.deleteMany({ where: { userId } });
    await db.favorite.deleteMany({ where: { userId } });
    await db.review.deleteMany({ where: { userId } });
    await db.preference.deleteMany({ where: { userId } });
    await db.searchLog.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true, deleted: userId });
  } catch (e: any) {
    return NextResponse.json({ error: "failed to delete user", detail: e?.message || null }, { status: 500 });
  }
}
