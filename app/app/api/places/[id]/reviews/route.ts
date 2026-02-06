import { NextRequest, NextResponse } from "next/server";
import { createServerClient, Place, Review, HelpfulnessVote, getUserVotes } from "@/lib/db";

interface PlaceWithReviews extends Place {
  reviews: (Review & { isOwnReview: boolean })[];
  userVotes: HelpfulnessVote[];
  isAuthenticated: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth is optional — anonymous users can view reviews (blurred on client)
  const auth = req.cookies.get("auth");

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
    // Auth cookie stores the nullifier_hash as a plain string
    const currentUserNullifier = auth?.value || null;
    const reviewIds = (reviews || []).map((r: Review) => r.id);
    const userVotes = currentUserNullifier
      ? await getUserVotes(currentUserNullifier, reviewIds)
      : [];

    const reviewsWithOwnership = (reviews || []).map((r: Review) => ({
      ...r,
      isOwnReview: !!(currentUserNullifier && r.user_nullifier === currentUserNullifier),
    }));

    const result: PlaceWithReviews = {
      ...place,
      reviews: reviewsWithOwnership,
      userVotes,
      isAuthenticated: !!currentUserNullifier,
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
