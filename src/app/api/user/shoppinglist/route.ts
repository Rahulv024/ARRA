import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lists = await db.shoppingList.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { label: "asc" } } },
  });
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listName, items } = await req.json();
  const list = await db.shoppingList.create({
    data: { name: (listName || "My List").toString().slice(0, 60), userId: session.user.id },
  });
  const rows = Array.isArray(items) ? items : [];
  if (rows.length) {
    await db.shoppingItem.createMany({
      data: rows.map((it: any) => ({
        listId: list.id,
        label: (it.name || it.label || "").toString().slice(0, 200),
        quantity: typeof it.amount === "number" ? it.amount : null,
        unit: typeof it.unit === "string" ? it.unit : null,
        meta: it.meta ?? null,
      })),
    });
  }
  return NextResponse.json({ ok: true, listId: list.id });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId, checked } = await req.json().catch(() => ({}));
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  await db.shoppingItem.update({ where: { id: String(itemId) }, data: { checked: !!checked } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  const listId = url.searchParams.get("listId");

  if (listId) {
    const list = await db.shoppingList.findFirst({ where: { id: listId, userId: session.user.id } });
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.shoppingItem.deleteMany({ where: { listId } });
    await db.shoppingList.delete({ where: { id: listId } });
    return NextResponse.json({ ok: true, deleted: "list" });
  }

  if (itemId) {
    await db.shoppingItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true, deleted: "item" });
  }

  return NextResponse.json({ error: "itemId or listId required" }, { status: 400 });
}

