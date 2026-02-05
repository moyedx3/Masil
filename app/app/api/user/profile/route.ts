import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.cookies.get("auth");
  if (!auth?.value) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let authData: { nullifier_hash?: string } = {};
  try {
    authData = JSON.parse(auth.value);
  } catch {
    return NextResponse.json(
      { error: "Invalid auth data" },
      { status: 401 }
    );
  }

  const nullifierHash = authData.nullifier_hash;
  if (!nullifierHash) {
    return NextResponse.json(
      { error: "No user identifier found" },
      { status: 401 }
    );
  }

  try {
    const profile = await getUserProfile(nullifierHash);
    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
