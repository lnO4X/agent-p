import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { activationCodes } from "@/db/schema";

function generateCode(): string {
  // 8 char alphanumeric uppercase
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/admin/codes — Generate activation codes (requires CRON_SECRET)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const count = Math.min(Number(body.count) || 1, 50);
  const durationDays = Number(body.durationDays) || 30;

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const id = nanoid();
    await db.insert(activationCodes).values({
      id,
      code,
      tier: "premium",
      durationDays,
    });
    codes.push(code);
  }

  return NextResponse.json({
    success: true,
    data: { codes, durationDays },
  });
}
