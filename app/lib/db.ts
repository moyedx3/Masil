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
