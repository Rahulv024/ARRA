import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/server/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null as any;
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const take = Math.min(parseInt(url.searchParams.get("take") || "50", 10), 100);
  const skip = Math.max(parseInt(url.searchParams.get("skip") || "0", 10), 0);

  const where: any = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { id: { contains: q } }] }
    : {};

  const [items, total] = await Promise.all([
    db.recipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        image: true,
        spoonacularId: true,
        readyInMinutes: true,
        servings: true,
        cuisines: true,
        diets: true,
        sourceUrl: true,
        updatedAt: true,
      },
    }),
    db.recipe.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as any;
  if (!body || !body.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const data = {
    title: String(body.title),
    image: body.image || null,
    spoonacularId: typeof body.spoonacularId === "number" ? (body.spoonacularId as number) : null,
    readyInMinutes: typeof body.readyInMinutes === "number" ? (body.readyInMinutes as number) : null,
    servings: typeof body.servings === "number" ? (body.servings as number) : null,
    cuisines: Array.isArray(body.cuisines) ? (body.cuisines as string[]) : [],
    diets: Array.isArray(body.diets) ? (body.diets as string[]) : [],
    sourceUrl: body.sourceUrl || null,
    ingredients: Array.isArray(body.ingredients) ? (body.ingredients as any[]) : null,
    steps: Array.isArray(body.steps) ? (body.steps as any[]) : null,
  };

  // If a spoonacularId is provided and already exists, update instead of create
  if (data.spoonacularId != null) {
    const existing = await db.recipe.findUnique({ where: { spoonacularId: data.spoonacularId } });
    if (existing) {
      const rec = await db.recipe.update({
        where: { id: existing.id },
        data,
        select: { id: true, title: true, image: true, spoonacularId: true, readyInMinutes: true, servings: true, cuisines: true, diets: true, sourceUrl: true },
      });
      return NextResponse.json({ ok: true, recipe: rec, updated: true }, { status: 200 });
    }
  }

  try {
    const id = body.id || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const rec = await db.recipe.create({
      data: { id, ...data },
      select: { id: true, title: true, image: true, spoonacularId: true, readyInMinutes: true, servings: true, cuisines: true, diets: true, sourceUrl: true },
    });
    return NextResponse.json({ ok: true, recipe: rec }, { status: 201 });
  } catch (e: any) {
    // Handle unique constraint on spoonacularId gracefully
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A recipe with this Spoonacular ID already exists. Consider editing it instead.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'failed to create', detail: e?.message || null }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as any;
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.image === "string" || body.image === null) data.image = body.image ?? null;
  if (typeof body.sourceUrl === "string" || body.sourceUrl === null) data.sourceUrl = body.sourceUrl ?? null;
  if (typeof body.spoonacularId === "number" || body.spoonacularId === null) data.spoonacularId = body.spoonacularId ?? null;
  if (typeof body.readyInMinutes === "number" || body.readyInMinutes === null) data.readyInMinutes = body.readyInMinutes ?? null;
  if (typeof body.servings === "number" || body.servings === null) data.servings = body.servings ?? null;
  if (Array.isArray(body.cuisines)) data.cuisines = body.cuisines;
  if (Array.isArray(body.diets)) data.diets = body.diets;
  if (Array.isArray(body.ingredients) || body.ingredients === null) data.ingredients = body.ingredients ?? null;
  if (Array.isArray(body.steps) || body.steps === null) data.steps = body.steps ?? null;

  try {
    const rec = await db.recipe.update({
      where: { id },
      data,
      select: { id: true, title: true, image: true, spoonacularId: true, readyInMinutes: true, servings: true, cuisines: true, diets: true, sourceUrl: true },
    });
    return NextResponse.json({ ok: true, recipe: rec });
  } catch (e: any) {
    return NextResponse.json({ error: "failed to update", detail: e?.message || null }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const qId = url.searchParams.get("id");
  const body = (await req.json().catch(() => ({} as any))) as { id?: string };
  const id = String(body?.id || qId || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await db.favorite.deleteMany({ where: { recipeId: id } });
    await db.review.deleteMany({ where: { recipeId: id } });
    await db.recipe.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (e: any) {
    return NextResponse.json({ error: "failed to delete", detail: e?.message || null }, { status: 500 });
  }
}
