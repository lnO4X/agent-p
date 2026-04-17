import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PERSONALITY_CODES } from "@/lib/personality-types";
import { logger } from "@/lib/logger";

const setPersonalitySchema = z.object({
  personalityType: z
    .string()
    .toUpperCase()
    .refine((v) => PERSONALITY_CODES.includes(v), {
      message: "Invalid personality type code",
    }),
});

// GET /api/auth/personality — Get current user's personality type
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const result = await db
      .select({ personalityType: users.personalityType })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { personalityType: result[0].personalityType },
    });
  } catch (err) {
    logger.error("auth.personality", "GET failed", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch personality type" } },
      { status: 500 }
    );
  }
}

// POST /api/auth/personality — Set current user's personality type
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = setPersonalitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid input",
          },
        },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        personalityType: parsed.data.personalityType,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.sub));

    return NextResponse.json({
      success: true,
      data: { personalityType: parsed.data.personalityType },
    });
  } catch (err) {
    logger.error("auth.personality", "POST failed", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to set personality type" } },
      { status: 500 }
    );
  }
}
