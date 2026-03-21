import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/billing/checkout — Create a LemonSqueezy checkout URL
 *
 * Body: { productType: "deep_report" }
 * Returns: { success: true, data: { url: "https://xxx.lemonsqueezy.com/checkout/..." } }
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json(
      { success: false, error: "Payment not configured" },
      { status: 503 }
    );
  }

  try {
    // Get user info for pre-filling checkout
    const user = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gametan.ai";

    // Create checkout via LemonSqueezy API
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user[0].email || undefined,
              custom: {
                user_id: auth.sub,
              },
            },
            checkout_options: {
              dark: true,
              embed: false,
            },
            product_options: {
              redirect_url: `${baseUrl}/me/premium?purchased=1`,
              receipt_thank_you_note:
                "Your GameTan Deep Profile Report is being generated! Check your dashboard.",
            },
          },
          relationships: {
            store: {
              data: { type: "stores", id: storeId },
            },
            variant: {
              data: { type: "variants", id: variantId },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[billing/checkout] LemonSqueezy error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to create checkout" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const checkoutUrl = data.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { success: false, error: "No checkout URL returned" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: checkoutUrl },
    });
  } catch (err) {
    console.error("[billing/checkout] error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
