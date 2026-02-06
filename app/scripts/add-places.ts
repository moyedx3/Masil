/**
 * Add individual places to Supabase
 *
 * Usage:
 *   npx tsx scripts/add-places.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newPlaces = [
  {
    name: "Frank Burger Sungin",
    name_korean: "프랭크버거 숭인점",
    latitude: 37.5755766,
    longitude: 127.0215101,
    category: "restaurant",
    address: "Sungin-dong, Jongno-gu, Seoul",
  },
  {
    name: "NOUDIT Ikseon",
    name_korean: "누딧 익선",
    latitude: 37.5739727,
    longitude: 126.989275,
    category: "cafe",
    address: "Ikseon-dong, Jongno-gu, Seoul",
  },
];

async function main() {
  for (const place of newPlaces) {
    // Check if already exists by name
    const { data: existing } = await supabase
      .from("places")
      .select("id")
      .eq("name", place.name)
      .single();

    if (existing) {
      console.log(`⏭ "${place.name}" already exists (id: ${existing.id})`);
      continue;
    }

    const { data, error } = await supabase
      .from("places")
      .insert(place)
      .select()
      .single();

    if (error) {
      console.error(`✗ Error inserting "${place.name}":`, error.message);
    } else {
      console.log(`✓ Added "${place.name}" (id: ${data.id})`);
    }
  }
}

main().catch(console.error);
