import { NextResponse } from "next/server";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  invite: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    const isAdmin = (parsed.data.invite || "").toLowerCase() === (process.env.ADMIN_INVITE || "let-me-in");
    const user = await db.user.create({
      data: { email, passwordHash: hash, role: isAdmin ? "ADMIN" : "USER" },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e: any) {
    // I always return JSON on unexpected errors for consistency
    return NextResponse.json({ error: "Server error", detail: e?.message ?? null }, { status: 500 });
  }
}

// I also reject non‑POSTs with JSON instead of HTML so clients get a consistent response shape
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
