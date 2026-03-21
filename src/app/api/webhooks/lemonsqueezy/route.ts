import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * POST /api/webhooks/lemonsqueezy — Handle LemonSqueezy webhook events
 *
 * Events handled:
 * - order_created: One-time purchase completed → upgrade user to premium
 *
 * Signature verification: HMAC SHA-256 with LEMONSQUEEZY_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/ls] LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify signature
  const signature = request.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    console.error("[webhook/ls] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the event
  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data;

  console.log(`[webhook/ls] Received event: ${eventName}`);

  if (eventName === "order_created") {
    const userId = customData?.user_id;

    if (!userId) {
      console.error("[webhook/ls] order_created but no user_id in custom_data");
      // Still return 200 to avoid retries
      return NextResponse.json({ received: true });
    }

    const orderId = event.data?.id;
    const orderTotal = event.data?.attributes?.total_formatted;
    const customerEmail = event.data?.attributes?.user_email;

    console.log(
      `[webhook/ls] Order ${orderId}: user=${userId}, total=${orderTotal}, email=${customerEmail}`
    );

    try {
      // Grant 365 days of premium (one-time purchase = 1 year)
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
        // Extend from current expiry if still active
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

      console.log(
        `[webhook/ls] User ${userId} upgraded to premium until ${newExpiry.toISOString()}`
      );
    } catch (err) {
      console.error("[webhook/ls] DB error upgrading user:", err);
      // Return 500 so LemonSqueezy retries
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  // Return 200 for all events (including unhandled ones)
  return NextResponse.json({ received: true });
}
