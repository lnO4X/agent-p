import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/creem — Handle Creem webhook events
 *
 * Events: checkout.completed, subscription.active, etc.
 * Signature: HMAC SHA-256 with CREEM_WEBHOOK_SECRET in x-creem-signature header
 */
export async function POST(request: Request) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const rawBody = await request.text();

  // Fail closed: reject all webhooks if secret is not configured
  if (!secret) {
    logger.error("webhook.creem", "CREEM_WEBHOOK_SECRET not configured — rejecting webhook");
    return NextResponse.json({ success: false, error: "Webhook verification not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-creem-signature") || request.headers.get("x-signature");
  if (!signature) {
    logger.error("webhook.creem", "No signature header");
    return NextResponse.json({ success: false, error: "No signature" }, { status: 401 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      logger.error("webhook.creem", "Invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    logger.error("webhook.creem", "Signature comparison failed");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type || event.type || "unknown";
  const metadata = event.metadata || event.data?.metadata || {};

  // Log event type only (not full payload) for production debugging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[webhook/creem] Event: ${eventType}`, JSON.stringify(event).slice(0, 500));
  }

  // Handle successful payment
  if (eventType === "checkout.completed" || eventType === "order.paid") {
    const userId = metadata.user_id;

    if (!userId) {
      logger.error("webhook.creem", "Payment completed but no user_id in metadata");
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

      // Premium upgrade success — logged for audit trail
      console.info(`[webhook/creem] Premium upgrade: user=${userId} expires=${newExpiry.toISOString()}`);
    } catch (err) {
      logger.error("webhook.creem", "DB error upgrading user", err);
      return NextResponse.json({ success: false, error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
