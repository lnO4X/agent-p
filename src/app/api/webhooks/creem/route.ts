import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * POST /api/webhooks/creem — Handle Creem webhook events
 *
 * Events: checkout.completed, subscription.active, etc.
 * Signature: HMAC SHA-256 with CREEM_WEBHOOK_SECRET in x-creem-signature header
 */
export async function POST(request: Request) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const rawBody = await request.text();

  // Verify signature if secret is configured
  if (secret) {
    const signature = request.headers.get("x-creem-signature") || request.headers.get("x-signature");
    if (!signature) {
      console.error("[webhook/creem] No signature header");
      return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(rawBody).digest("hex");

    try {
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        console.error("[webhook/creem] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      console.error("[webhook/creem] Signature comparison failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type || event.type || "unknown";
  const metadata = event.metadata || event.data?.metadata || {};

  console.log(`[webhook/creem] Event: ${eventType}`, JSON.stringify(event).slice(0, 500));

  // Handle successful payment
  if (eventType === "checkout.completed" || eventType === "order.paid") {
    const userId = metadata.user_id;

    if (!userId) {
      console.error("[webhook/creem] Payment completed but no user_id in metadata");
      return NextResponse.json({ received: true });
    }

    try {
      const now = new Date();
      const currentUser = await db
        .select({ tier: users.tier, tierExpiresAt: users.tierExpiresAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      let baseDate = now;
      if (
        currentUser.length > 0 &&
        currentUser[0].tier === "premium" &&
        currentUser[0].tierExpiresAt &&
        currentUser[0].tierExpiresAt > now
      ) {
        baseDate = currentUser[0].tierExpiresAt;
      }

      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + 365);

      await db
        .update(users)
        .set({
          tier: "premium",
          tierExpiresAt: newExpiry,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      console.log(`[webhook/creem] User ${userId} upgraded to premium until ${newExpiry.toISOString()}`);
    } catch (err) {
      console.error("[webhook/creem] DB error upgrading user:", err);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
