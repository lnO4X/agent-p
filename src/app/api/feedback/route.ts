import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { z } from "zod";

const feedbackSchema = z.object({
  score: z.number().min(1).max(10),
  comment: z.string().max(500).optional(),
  context: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const auth = await getAuthFromCookie();

  // productFeedback table removed — log for now so feedback isn't silently lost
  console.log("[feedback]", {
    userId: auth?.sub ?? null,
    score: parsed.data.score,
    comment: parsed.data.comment ?? null,
    context: parsed.data.context,
  });

  return NextResponse.json({ success: true });
}
