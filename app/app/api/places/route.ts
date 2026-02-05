import { NextRequest, NextResponse } from "next/server";
import { getPlaces } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Check authentication
  const auth = req.cookies.get("auth");
  if (!auth?.value) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const places = await getPlaces();

    return NextResponse.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
