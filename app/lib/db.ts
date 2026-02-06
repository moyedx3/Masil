import { createClient } from "@supabase/supabase-js";

// Types for our database
export type AccessTier = "orb" | "paid";

export interface User {
  nullifier_hash: string;
  wallet_address: string | null;
  trust_score: number;
  review_count: number;
  access_tier: AccessTier;
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

// Category mapping with SVG icon paths (Phosphor regular, viewBox 0 0 256 256)
export const CATEGORIES = {
  cafe: {
    emoji: "☕",
    label: "Cafe",
    color: "#B87C4C",
    iconPath: "M80,56V24a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,120,64Zm32,0a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,152,64Zm96,56v8a40,40,0,0,1-37.51,39.91,96.59,96.59,0,0,1-27,40.09H208a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16H56.54A96.3,96.3,0,0,1,24,136V88a8,8,0,0,1,8-8H208A40,40,0,0,1,248,120ZM200,96H40v40a80.27,80.27,0,0,0,45.12,72h69.76A80.27,80.27,0,0,0,200,136Zm32,24a24,24,0,0,0-16-22.62V136a95.78,95.78,0,0,1-1.2,15A24,24,0,0,0,232,128Z",
  },
  restaurant: {
    emoji: "🍽️",
    label: "Restaurant",
    color: "#778873",
    iconPath: "M72,88V40a8,8,0,0,1,16,0V88a8,8,0,0,1-16,0ZM216,40V224a8,8,0,0,1-16,0V176H152a8,8,0,0,1-8-8,268.75,268.75,0,0,1,7.22-56.88c9.78-40.49,28.32-67.63,53.63-78.47A8,8,0,0,1,216,40ZM200,53.9c-32.17,24.57-38.47,84.42-39.7,106.1H200ZM119.89,38.69a8,8,0,1,0-15.78,2.63L112,88.63a32,32,0,0,1-64,0l7.88-47.31a8,8,0,1,0-15.78-2.63l-8,48A8.17,8.17,0,0,0,32,88a48.07,48.07,0,0,0,40,47.32V224a8,8,0,0,0,16,0V135.32A48.07,48.07,0,0,0,128,88a8.17,8.17,0,0,0-.11-1.31Z",
  },
  atm: {
    emoji: "🏧",
    label: "ATM",
    color: "#A8BBA3",
    iconPath: "M240,128H217.89l21.52-53a8,8,0,1,0-14.82-6l-24,59H159.38l-24-59a8,8,0,0,0-14.82,0l-24,59H55.38l-24-59a8,8,0,0,0-14.82,6l21.52,53H16a8,8,0,0,0,0,16H44.61l24,59a8,8,0,0,0,14.82,0l24-59h41.24l24,59a8,8,0,0,0,14.82,0l24-59H240a8,8,0,0,0,0-16ZM76,178.75,61.88,144H90.12ZM113.88,128,128,93.26,142.12,128ZM180,178.75,165.88,144h28.24Z",
  },
  hospital: {
    emoji: "🏥",
    label: "Hospital/Clinic",
    color: "#D2735E",
    iconPath: "M248,208h-8V128a16,16,0,0,0-16-16H168V48a16,16,0,0,0-16-16H56A16,16,0,0,0,40,48V208H32a8,8,0,0,0,0,16H248a8,8,0,0,0,0-16Zm-24-80v80H168V128ZM56,48h96V208H136V160a8,8,0,0,0-8-8H80a8,8,0,0,0-8,8v48H56Zm64,160H88V168h32ZM72,96a8,8,0,0,1,8-8H96V72a8,8,0,0,1,16,0V88h16a8,8,0,0,1,0,16H112v16a8,8,0,0,1-16,0V104H80A8,8,0,0,1,72,96Z",
  },
  pharmacy: {
    emoji: "💊",
    label: "Pharmacy",
    color: "#A1BC98",
    iconPath: "M216.42,39.6a53.26,53.26,0,0,0-75.32,0L39.6,141.09a53.26,53.26,0,0,0,75.32,75.31h0L216.43,114.91A53.31,53.31,0,0,0,216.42,39.6ZM103.61,205.09h0a37.26,37.26,0,0,1-52.7-52.69L96,107.31,148.7,160ZM205.11,103.6,160,148.69,107.32,96l45.1-45.09a37.26,37.26,0,0,1,52.69,52.69ZM189.68,82.34a8,8,0,0,1,0,11.32l-24,24a8,8,0,1,1-11.31-11.32l24-24A8,8,0,0,1,189.68,82.34Z",
  },
  service: {
    emoji: "🔧",
    label: "Service",
    color: "#8B7355",
    iconPath: "M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,187,29.24,72,72,0,0,0,88,96,72.34,72.34,0,0,0,94,124.94L33.79,177c-.15.12-.29.26-.43.39a32,32,0,0,0,45.26,45.26c.13-.13.27-.28.39-.42L131.06,162A72,72,0,0,0,232,96,71.56,71.56,0,0,0,226.76,69ZM160,152a56.14,56.14,0,0,1-27.07-7,8,8,0,0,0-9.92,1.77L67.11,211.51a16,16,0,0,1-22.62-22.62L109.18,133a8,8,0,0,0,1.77-9.93,56,56,0,0,1,58.36-82.31l-31.2,33.81a8,8,0,0,0-1.94,7.1L141.83,108a8,8,0,0,0,6.14,6.14l26.35,5.66a8,8,0,0,0,7.1-1.94l33.81-31.2A56.06,56.06,0,0,1,160,152Z",
  },
  other: {
    emoji: "📍",
    label: "Other",
    color: "#D2DCB6",
    iconPath: "M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z",
  },
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
