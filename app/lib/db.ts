import { createClient } from "@supabase/supabase-js";

// Types for our database
export interface User {
  nullifier_hash: string;
  wallet_address: string | null;
  trust_score: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  name: string;
  name_korean: string | null;
  latitude: number;
  longitude: number;
  category: string;
  google_place_id: string | null;
  address: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_nullifier: string | null;
  content: string;
  rating: number | null;
  tags: string[];
  helpful_count: number;
  not_helpful_count: number;
  source: "user" | "imported";
  original_platform: string | null;
  original_author: string | null;
  imported_at: string | null;
  created_at: string;
}

export interface HelpfulnessVote {
  id: string;
  review_id: string;
  voter_nullifier: string;
  is_helpful: boolean;
  created_at: string;
}

// Trust score tiers
export const TRUST_TIERS = {
  trusted: { min: 80, color: "#A1BC98", label: "Trusted Local" },
  reliable: { min: 60, color: "#A8BBA3", label: "Reliable" },
  new: { min: 40, color: "#D2DCB6", label: "New User" },
  low: { min: 20, color: "#B87C4C", label: "Low Trust" },
  untrusted: { min: 0, color: "#EF4444", label: "Untrusted" },
} as const;

export type TrustTierKey = keyof typeof TRUST_TIERS;

export function getTrustTier(score: number): { key: TrustTierKey; color: string; label: string } {
  if (score >= 80) return { key: "trusted", ...TRUST_TIERS.trusted };
  if (score >= 60) return { key: "reliable", ...TRUST_TIERS.reliable };
  if (score >= 40) return { key: "new", ...TRUST_TIERS.new };
  if (score >= 20) return { key: "low", ...TRUST_TIERS.low };
  return { key: "untrusted", ...TRUST_TIERS.untrusted };
}

// Category mapping for emoji pins
export const CATEGORIES = {
  atm: { emoji: "🏧", label: "ATM" },
  hospital: { emoji: "🏥", label: "Hospital/Clinic" },
  pharmacy: { emoji: "💊", label: "Pharmacy" },
  restaurant: { emoji: "🍽️", label: "Restaurant" },
  cafe: { emoji: "☕", label: "Cafe" },
  service: { emoji: "🔧", label: "Service" },
  other: { emoji: "📍", label: "Other" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

// Server-side client (uses secret key for full access)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

  return createClient(supabaseUrl, supabaseSecretKey);
}

// Get user by nullifier_hash
export async function getUser(nullifier_hash: string): Promise<User | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("nullifier_hash", nullifier_hash)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

// Create or update user (upsert for race-safety)
export async function upsertUser(
  nullifier_hash: string,
  wallet_address?: string
): Promise<User | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        nullifier_hash,
        wallet_address: wallet_address || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "nullifier_hash",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error);
    return null;
  }

  return data as User;
}

// Get all places
export async function getPlaces(): Promise<Place[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching places:", error);
    return [];
  }

  return data as Place[];
}

// Get a place by ID
export async function getPlace(placeId: string): Promise<Place | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", placeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Place;
}

// Create a new review
export async function createReview(review: {
  place_id: string;
  user_nullifier: string;
  content: string;
  rating?: number;
  tags?: string[];
}): Promise<Review | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      place_id: review.place_id,
      user_nullifier: review.user_nullifier,
      content: review.content,
      rating: review.rating || null,
      tags: review.tags || [],
      source: "user",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    return null;
  }

  return data as Review;
}

// Get reviews for a place
export async function getReviewsByPlace(placeId: string): Promise<Review[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data as Review[];
}

// Get user's votes for specific reviews
export async function getUserVotes(
  voterNullifier: string,
  reviewIds: string[]
): Promise<HelpfulnessVote[]> {
  if (reviewIds.length === 0) return [];
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("helpfulness_votes")
    .select("*")
    .eq("voter_nullifier", voterNullifier)
    .in("review_id", reviewIds);

  if (error) {
    console.error("Error fetching user votes:", error);
    return [];
  }

  return data as HelpfulnessVote[];
}

// Submit or update a vote
export async function submitVote(
  reviewId: string,
  voterNullifier: string,
  isHelpful: boolean
): Promise<{ vote: HelpfulnessVote; review: Review } | null> {
  const supabase = createServerClient();

  // Upsert the vote
  const { data: vote, error: voteError } = await supabase
    .from("helpfulness_votes")
    .upsert(
      { review_id: reviewId, voter_nullifier: voterNullifier, is_helpful: isHelpful },
      { onConflict: "review_id,voter_nullifier" }
    )
    .select()
    .single();

  if (voteError) {
    console.error("Error submitting vote:", voteError);
    return null;
  }

  // Recount votes for the review
  const { count: helpfulCount } = await supabase
    .from("helpfulness_votes")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("is_helpful", true);

  const { count: notHelpfulCount } = await supabase
    .from("helpfulness_votes")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("is_helpful", false);

  // Update review counts
  const { data: review, error: updateError } = await supabase
    .from("reviews")
    .update({
      helpful_count: helpfulCount || 0,
      not_helpful_count: notHelpfulCount || 0,
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating review counts:", updateError);
    return null;
  }

  // Recalculate author trust score
  if (review.user_nullifier) {
    await recalculateTrustScore(review.user_nullifier);
  }

  return { vote: vote as HelpfulnessVote, review: review as Review };
}

// Recalculate trust score for a user based on all votes on their reviews
async function recalculateTrustScore(userNullifier: string): Promise<void> {
  const supabase = createServerClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("helpful_count, not_helpful_count")
    .eq("user_nullifier", userNullifier);

  if (!reviews) return;

  const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0);
  const totalNotHelpful = reviews.reduce((sum, r) => sum + (r.not_helpful_count || 0), 0);

  // Base 50 + 2 per helpful - 3 per not helpful, clamped to 0-100
  const score = Math.max(0, Math.min(100, 50 + totalHelpful * 2 - totalNotHelpful * 3));

  await supabase
    .from("users")
    .update({ trust_score: score, updated_at: new Date().toISOString() })
    .eq("nullifier_hash", userNullifier);
}

// Get user profile with stats
export async function getUserProfile(nullifierHash: string) {
  const supabase = createServerClient();

  const user = await getUser(nullifierHash);
  if (!user) return null;

  // Get user's reviews with place names
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, places(name)")
    .eq("user_nullifier", nullifierHash)
    .order("created_at", { ascending: false });

  // Count total helpful votes received
  const { data: userReviews } = await supabase
    .from("reviews")
    .select("helpful_count")
    .eq("user_nullifier", nullifierHash);

  const helpfulVotesReceived = userReviews?.reduce((sum, r) => sum + (r.helpful_count || 0), 0) || 0;

  return {
    user,
    stats: {
      review_count: user.review_count,
      helpful_votes_received: helpfulVotesReceived,
    },
    reviews: (reviews || []).map((r: Record<string, unknown>) => ({
      ...r,
      place_name: (r.places as { name: string } | null)?.name || "Unknown Place",
    })),
  };
}
