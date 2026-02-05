import { NextRequest, NextResponse } from "next/server";
import { createReview, getPlace, getUser } from "@/lib/db";
import { haversineDistance } from "@/lib/geo";

interface CreateReviewBody {
  place_id: string;
  content: string;
  rating?: number;
  tags?: string[];
  user_lat: number;
  user_lng: number;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const auth = req.cookies.get("auth");
    if (!auth?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists in database
    const user = await getUser(auth.value);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const body: CreateReviewBody = await req.json();
    const { place_id, content, rating, tags, user_lat, user_lng } = body;

    // Validate required fields
    if (!place_id || !content || user_lat == null || user_lng == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 1 || content.length > 500) {
      return NextResponse.json(
        { success: false, error: "Review must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Get the place to verify GPS
    const place = await getPlace(place_id);
    if (!place) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    // Server-side GPS verification
    const distance = Math.round(
      haversineDistance(user_lat, user_lng, place.latitude, place.longitude)
    );

    if (distance > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be within 50m of this location to post a review",
          distance,
        },
        { status: 403 }
      );
    }

    // Create the review
    const review = await createReview({
      place_id,
      user_nullifier: auth.value,
      content,
      rating,
      tags,
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Failed to create review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
