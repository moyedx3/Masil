import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get("auth");

    if (!authCookie?.value) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify the user exists in database
    const user = await getUser(authCookie.value);

    if (!user) {
      // Cookie exists but user not in database - clear the invalid cookie
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete("auth");
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      access_tier: user.access_tier || "orb",
      user: {
        nullifier_hash: user.nullifier_hash,
        trust_score: user.trust_score,
        review_count: user.review_count,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
