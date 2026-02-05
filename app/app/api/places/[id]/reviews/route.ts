import { NextRequest, NextResponse } from "next/server";
import { createServerClient, Place, Review, HelpfulnessVote, getUserVotes } from "@/lib/db";

interface PlaceWithReviews extends Place {
  reviews: Review[];
  userVotes: HelpfulnessVote[];
  currentUserNullifier: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const auth = req.cookies.get("auth");
  if (!auth?.value) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // Fetch place details
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .single();

    if (placeError || !place) {
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      );
    }

    // Fetch reviews for the place
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("place_id", id)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Fetch user's votes for these reviews
    let authData: { nullifier_hash?: string } = {};
    try {
      authData = JSON.parse(auth.value);
    } catch {
      // ignore parse errors
    }
    const currentUserNullifier = authData.nullifier_hash || null;
    const reviewIds = (reviews || []).map((r: Review) => r.id);
    const userVotes = currentUserNullifier
      ? await getUserVotes(currentUserNullifier, reviewIds)
      : [];

    const result: PlaceWithReviews = {
      ...place,
      reviews: reviews || [],
      userVotes,
      currentUserNullifier,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching place with reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
