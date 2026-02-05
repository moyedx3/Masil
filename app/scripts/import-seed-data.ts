/**
 * Import filtered seed data to Supabase
 *
 * Usage:
 *   npx ts-node scripts/import-seed-data.ts filtered-data.json
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: ".env.local" });

// Types matching filtered data
interface FilteredReview {
  author: string;
  content: string;
  rating: number;
  date: string;
}

interface FilteredPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  google_place_id: string;
  category: string;
  reviews: FilteredReview[];
}

// Auto-detect tags from review content
const TAG_KEYWORDS: Record<string, string[]> = {
  english_menu: ["english menu", "menu in english"],
  english_staff: ["speak english", "english speaking", "staff speaks english", "speaks english"],
  free_wifi: ["wifi", "wi-fi", "free internet"],
  card_ok: ["credit card", "card payment", "visa", "mastercard", "accepts card"],
  vegetarian: ["vegetarian", "vegan", "veggie"],
  foreigner_friendly: ["foreigner friendly", "tourist friendly", "expat friendly", "welcoming to foreigners"],
  global_atm: ["foreign card", "international card", "global atm", "accepts foreign"],
  cash_only: ["cash only", "no card", "doesn't accept card"],
  korean_only: ["korean only", "no english", "doesn't speak english"],
};

function detectTags(content: string): string[] {
  const lower = content.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        tags.push(tag);
        break;
      }
    }
  }

  return tags;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: npx ts-node scripts/import-seed-data.ts <filtered-data.json>");
    process.exit(1);
  }

  const inputPath = args[0];

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables. Ensure .env.local has:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL");
    console.error("  SUPABASE_SECRET_KEY");
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read input data
  console.log(`Reading ${inputPath}...`);
  const rawData = fs.readFileSync(inputPath, "utf-8");
  const places: FilteredPlace[] = JSON.parse(rawData);

  console.log(`Found ${places.length} places to import`);

  let placesImported = 0;
  let reviewsImported = 0;

  for (const place of places) {
    // Check if place already exists
    const { data: existingPlace } = await supabase
      .from("places")
      .select("id")
      .eq("google_place_id", place.google_place_id)
      .single();

    let placeId: string;

    if (existingPlace) {
      placeId = existingPlace.id;
      console.log(`  ↳ Place already exists, skipping insert`);
    } else {
      // Insert place
      const { data: placeData, error: placeError } = await supabase
        .from("places")
        .insert({
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          category: place.category,
          google_place_id: place.google_place_id,
          address: place.address,
        })
        .select()
        .single();

      if (placeError) {
        console.error(`Error inserting place "${place.name}":`, placeError.message);
        continue;
      }
      placeId = placeData.id;
    }

    placesImported++;

    // Insert reviews
    for (const review of place.reviews) {
      const tags = detectTags(review.content);

      const { error: reviewError } = await supabase.from("reviews").insert({
        place_id: placeId,
        user_nullifier: null, // Imported reviews have no user
        content: review.content,
        rating: review.rating,
        tags: tags,
        source: "imported",
        original_platform: "google_maps",
        original_author: review.author,
        imported_at: new Date().toISOString(),
      });

      if (reviewError) {
        console.error(`Error inserting review for "${place.name}":`, reviewError.message);
        continue;
      }

      reviewsImported++;
    }

    console.log(`✓ ${place.name}: ${place.reviews.length} reviews`);
  }

  console.log("");
  console.log(`Import complete!`);
  console.log(`  Places: ${placesImported}`);
  console.log(`  Reviews: ${reviewsImported}`);
}

main().catch(console.error);
