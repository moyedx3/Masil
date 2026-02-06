import { NextRequest, NextResponse } from "next/server";
import { getUser, submitVote, createServerClient } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
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

  const voter = await getUser(auth.value);
  if (!voter) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }

  // Only orb-verified users can vote (paid tier is view-only)
  if (voter.access_tier !== "orb") {
    return NextResponse.json(
      { error: "Only Orb-verified users can vote" },
      { status: 403 }
    );
  }

  // Rate limit: 50 votes per day per user
  const { allowed } = rateLimit(`vote:${auth.value}`, 50);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again tomorrow." },
      { status: 429 }
    );
  }

  const { id: reviewId } = await params;

  if (!reviewId) {
    return NextResponse.json(
      { error: "Review ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { is_helpful } = body;

    if (typeof is_helpful !== "boolean") {
      return NextResponse.json(
        { error: "is_helpful must be a boolean" },
        { status: 400 }
      );
    }

    // Check the review exists and get author
    const supabase = createServerClient();
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("user_nullifier")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Prevent self-voting
    if (review.user_nullifier === voter.nullifier_hash) {
      return NextResponse.json(
        { error: "You cannot vote on your own review" },
        { status: 403 }
      );
    }

    // Submit the vote
    const result = await submitVote(reviewId, voter.nullifier_hash, is_helpful);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to submit vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote: {
        id: result.vote.id,
        review_id: result.vote.review_id,
        is_helpful: result.vote.is_helpful,
      },
      review: {
        helpful_count: result.review.helpful_count,
        not_helpful_count: result.review.not_helpful_count,
      },
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
