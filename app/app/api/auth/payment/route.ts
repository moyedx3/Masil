import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, reference } = await req.json();

    if (!transaction_id || !reference) {
      return NextResponse.json(
        { error: "Missing transaction_id or reference" },
        { status: 400 }
      );
    }

    // Verify transaction with World API
    const appId = process.env.APP_ID;
    if (!appId) {
      console.error("APP_ID not configured");
      return NextResponse.json(
        { error: "Payment verification not configured" },
        { status: 500 }
      );
    }

    const verifyUrl = `https://developer.worldcoin.org/api/v2/minikit/transaction/${transaction_id}?app_id=${appId}&type=payment`;
    const verifyRes = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
      },
    });

    if (!verifyRes.ok) {
      console.error("World API verification failed:", verifyRes.status);
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const tx = await verifyRes.json();

    // Validate reference matches
    if (tx.reference !== reference) {
      return NextResponse.json(
        { error: "Transaction reference mismatch" },
        { status: 400 }
      );
    }

    // Only accept completed/mined transactions
    if (tx.transaction_status !== "mined") {
      return NextResponse.json(
        { error: `Transaction not completed (status: ${tx.transaction_status})` },
        { status: 400 }
      );
    }

    // Create or find user by wallet address
    const walletAddress = tx.from;
    const paidNullifier = `paid_${walletAddress}`;

    const supabase = createServerClient();

    // Upsert user with paid access tier
    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          nullifier_hash: paidNullifier,
          wallet_address: walletAddress,
          access_tier: "paid",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "nullifier_hash",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error("Error creating paid user:", upsertError);
      return NextResponse.json(
        { error: "Failed to create user record" },
        { status: 500 }
      );
    }

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      access_tier: "paid",
    });

    response.cookies.set("auth", paidNullifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days for paid users
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
