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
