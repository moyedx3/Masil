/**
 * Filter Outscraper JSON to keep only foreigner reviews
 *
 * Usage:
 *   npx ts-node scripts/filter-reviews.ts input.json output.json
 *
 * Criteria:
 *   - Author name contains NO Korean characters (Hangul)
 *   - Review text is primarily English (>50% ASCII letters)
 *   - Review text is at least 20 characters
 */

import * as fs from "fs";

// Outscraper data types
interface OutscraperReview {
  author_title: string;
  review_text: string | null;
  review_rating: number;
  review_datetime_utc: string;
}

interface OutscraperPlace {
  name: string;
  full_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  reviews_data?: OutscraperReview[];
}

// Output types
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
  category: string; // Will need manual assignment
  reviews: FilteredReview[];
}

/**
 * Check if text contains Korean (Hangul) characters
 */
function containsKorean(text: string): boolean {
  // Hangul Unicode ranges: Syllables, Jamo, Compatibility Jamo
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

/**
 * Check if text is primarily English (simple heuristic)
 */
function isEnglish(text: string): boolean {
  if (!text || text.length === 0) return false;
  const asciiLetters = text.match(/[a-zA-Z]/g)?.length || 0;
  return asciiLetters / text.length > 0.5;
}

/**
 * Anonymize author name (e.g., "John Smith" -> "J***h")
 */
function anonymizeAuthor(name: string): string {
  if (!name || name.length < 2) return "***";
  if (name.length === 2) return name[0] + "*";
  return name.charAt(0) + "***" + name.slice(-1);
}

/**
 * Check if a review is from a foreigner
 */
function isForeignerReview(review: OutscraperReview): boolean {
  // Must have author name
  if (!review.author_title) return false;

  // Author name must NOT contain Korean
  if (containsKorean(review.author_title)) return false;

  // Must have review text
  if (!review.review_text) return false;

  // Review text must be primarily English
  if (!isEnglish(review.review_text)) return false;

  // Review text must be at least 20 characters
  if (review.review_text.length < 20) return false;

  return true;
}

/**
 * Process Outscraper data and filter for foreigner reviews
 */
function filterOutscraperData(data: OutscraperPlace[]): FilteredPlace[] {
  const results: FilteredPlace[] = [];

  for (const place of data) {
    const foreignerReviews: FilteredReview[] = [];

    if (place.reviews_data) {
      for (const review of place.reviews_data) {
        if (isForeignerReview(review)) {
          foreignerReviews.push({
            author: anonymizeAuthor(review.author_title),
            content: review.review_text!,
            rating: review.review_rating,
            date: review.review_datetime_utc,
          });
        }
      }
    }

    // Include place even if no foreigner reviews (we still want it on the map)
    results.push({
      name: place.name,
      address: place.full_address,
      latitude: place.latitude,
      longitude: place.longitude,
      google_place_id: place.place_id,
      category: "other", // Default - user should manually categorize
      reviews: foreignerReviews,
    });
  }

  return results;
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npx ts-node scripts/filter-reviews.ts <input.json> <output.json>");
    console.log("");
    console.log("Example:");
    console.log("  npx ts-node scripts/filter-reviews.ts outscraper-data.json filtered-data.json");
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  // Read input
  console.log(`Reading ${inputPath}...`);
  const rawData = fs.readFileSync(inputPath, "utf-8");
  const data: OutscraperPlace[] = JSON.parse(rawData);

  console.log(`Found ${data.length} places`);

  // Filter
  const filtered = filterOutscraperData(data);

  // Stats
  let totalReviews = 0;
  let foreignerReviews = 0;
  for (const place of data) {
    totalReviews += place.reviews_data?.length || 0;
  }
  for (const place of filtered) {
    foreignerReviews += place.reviews.length;
  }

  console.log(`Total reviews: ${totalReviews}`);
  console.log(`Foreigner reviews: ${foreignerReviews} (${((foreignerReviews / totalReviews) * 100).toFixed(1)}%)`);

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2));
  console.log(`Wrote ${outputPath}`);

  console.log("");
  console.log("IMPORTANT: Edit the output file to set correct categories:");
  console.log("  atm, hospital, pharmacy, restaurant, cafe, service, other");
}

main();
