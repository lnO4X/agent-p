import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bindEmailSchema } from "@/lib/validations";

// PUT /api/settings/email — Bind or update email
export async function PUT(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bindEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({
      email: parsed.data.email,
      emailVerifiedAt: new Date(), // MVP: auto-verify on bind
      updatedAt: new Date(),
    })
    .where(eq(users.id, auth.sub));

  return NextResponse.json({ success: true });
}
