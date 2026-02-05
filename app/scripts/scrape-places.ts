/**
 * Scrape Google Maps reviews using Outscraper API
 *
 * Usage:
 *   1. Create a file with Google Maps URLs (one per line)
 *   2. Run: npx ts-node scripts/scrape-places.ts <urls-file.txt> <output.json>
 *
 * Environment:
 *   OUTSCRAPER_API_KEY - Your Outscraper API key
 *
 * Example urls.txt:
 *   https://www.google.com/maps/place/Shinhan+Bank+Insadong
 *   https://www.google.com/maps/place/Seoul+National+University+Hospital
 */

import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
const REVIEWS_PER_PLACE = 50; // Max reviews to fetch per place

interface OutscraperResponse {
  id: string;
  status: string;
  data?: any[];
}

async function scrapePlace(url: string): Promise<any> {
  const apiUrl = "https://api.outscraper.com/maps/reviews-v3";

  const params = new URLSearchParams({
    query: url,
    reviewsLimit: String(REVIEWS_PER_PLACE),
    language: "en",
    sort: "newest",
  });

  const response = await fetch(`${apiUrl}?${params}`, {
    headers: {
      "X-API-KEY": OUTSCRAPER_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outscraper API error: ${response.status} - ${error}`);
  }

  const result: OutscraperResponse = await response.json();

  // Outscraper may return async task ID for large requests
  if (result.status === "Pending" && result.id) {
    console.log(`  Task pending, waiting for results...`);
    return await pollForResults(result.id);
  }

  return result.data?.[0] || null;
}

async function pollForResults(taskId: string, maxAttempts = 30): Promise<any> {
  const statusUrl = `https://api.outscraper.com/requests/${taskId}`;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000); // Wait 2 seconds between polls

    const response = await fetch(statusUrl, {
      headers: {
        "X-API-KEY": OUTSCRAPER_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const result: OutscraperResponse = await response.json();

    if (result.status === "Success" && result.data) {
      return result.data[0];
    }

    if (result.status === "Error") {
      throw new Error(`Task failed: ${JSON.stringify(result)}`);
    }

    console.log(`  Still processing... (attempt ${i + 1}/${maxAttempts})`);
  }

  throw new Error("Timeout waiting for results");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npx ts-node scripts/scrape-places.ts <urls-file.txt> <output.json>");
    console.log("");
    console.log("Create a text file with Google Maps URLs, one per line:");
    console.log("  https://www.google.com/maps/place/...");
    console.log("  https://www.google.com/maps/place/...");
    console.log("");
    console.log("Make sure OUTSCRAPER_API_KEY is set in .env.local");
    process.exit(1);
  }

  if (!OUTSCRAPER_API_KEY) {
    console.error("Error: OUTSCRAPER_API_KEY not found in .env.local");
    console.error("Add this line to your .env.local file:");
    console.error("  OUTSCRAPER_API_KEY=your_api_key_here");
    process.exit(1);
  }

  const urlsFile = args[0];
  const outputFile = args[1];

  // Read URLs
  const urlsContent = fs.readFileSync(urlsFile, "utf-8");
  const urls = urlsContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  console.log(`Found ${urls.length} URLs to scrape`);
  console.log("");

  const results: any[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Scraping: ${url.substring(0, 60)}...`);

    try {
      const data = await scrapePlace(url);
      if (data) {
        results.push(data);
        console.log(`  ✓ Got ${data.reviews_data?.length || 0} reviews for "${data.name}"`);
      } else {
        console.log(`  ⚠ No data returned`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error: ${error.message}`);
    }

    // Rate limiting - wait between requests
    if (i < urls.length - 1) {
      await sleep(1000);
    }
  }

  // Save results
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log("");
  console.log(`Saved ${results.length} places to ${outputFile}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. pnpm filter-reviews ${outputFile} filtered-data.json`);
  console.log(`  2. Edit filtered-data.json to set categories (atm, hospital, pharmacy, restaurant, cafe, service)`);
  console.log(`  3. pnpm import-seed filtered-data.json`);
}

main().catch(console.error);
