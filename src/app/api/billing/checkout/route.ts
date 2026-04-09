import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/billing/checkout — Create a Creem checkout session
 *
 * Body: { productType: "deep_report" }
 * Returns: { success: true, data: { url: "https://checkout.creem.io/..." } }
 */
export async function POST(request: Request) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const apiKey = process.env.CREEM_API_KEY;
  const productId = process.env.CREEM_PRODUCT_ID;

  if (!apiKey || !productId) {
    return NextResponse.json(
      { success: false, error: "Payment not configured" },
      { status: 503 }
    );
  }

  try {
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

    // Create checkout via Creem API
    const response = await fetch("https://api.creem.io/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${baseUrl}/me/premium?purchased=1`,
        request_id: `gametan_${auth.sub}_${Date.now()}`,
        metadata: {
          user_id: auth.sub,
          username: user[0].username,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[billing/checkout] Creem error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to create checkout" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const checkoutUrl = data.checkout_url;

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
