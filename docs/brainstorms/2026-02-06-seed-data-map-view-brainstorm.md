# Brainstorm: Seed Data + Map View

**Date:** 2026-02-06
**Status:** Ready for planning

## What We're Building

A seed data pipeline and map view for Masil that:
- Displays 15-20 resident-essential places in Jongno-gu on a Mapbox map
- Shows real foreigner reviews scraped from Google Maps via Outscraper
- Focuses on **residents, not tourists** (ATMs, hospitals, pharmacies, restaurants)

## Key Differentiator

**Masil targets foreigners who LIVE in Korea, not tourists.**

This means prioritizing:
- ATMs that accept foreign cards
- Hospitals/clinics with English-speaking staff
- Pharmacies
- Everyday restaurants (not tourist traps)
- Services foreigners actually need regularly

## Why This Approach

**Hybrid: Manual Place Selection + Outscraper Reviews**

1. **Manual place curation** - You pick the 15-20 places you know are useful for foreign residents
2. **Outscraper for reviews** - Scrape reviews only from those specific places
3. **Filter criteria** - Keep only reviews with:
   - Non-Korean author names (detect Korean characters)
   - English text content
4. **Import to Supabase** - Run script to populate `places` and `reviews` tables

**Why this approach:**
- Full control over which places appear (no irrelevant tourist spots)
- Real reviews provide authenticity for demo
- Cost-effective ($2-5 for this volume)
- Aligns with resident-focused positioning

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data source | Outscraper | Real reviews, structured output, reasonable cost |
| Place selection | Manual curation | Control quality, ensure resident relevance |
| Filter method | Non-Korean names + English text | Identifies foreigner reviews accurately |
| Place count | 15-20 | Enough to fill map, manageable scope |
| Place types | ATMs, hospitals, pharmacies, restaurants | Resident essentials, not tourist attractions |
| Map provider | Mapbox GL JS | Already in tech stack per CLAUDE.md |

## Place Type Distribution (Suggested)

- 4-5 ATMs (accepting foreign cards)
- 3-4 Hospitals/Clinics
- 2-3 Pharmacies
- 5-6 Restaurants (everyday dining, not tourist spots)
- 1-2 Other services (laundry, phone repair, etc.)

## Workflow Summary

```
1. You curate list of 15-20 Google Maps place URLs
2. Outscraper scrapes reviews from those URLs
3. Export as JSON
4. Filter script keeps: non-Korean names + English reviews
5. Import script populates Supabase (places + reviews tables)
6. Mapbox displays pins with emoji by category
7. Click pin → show place name (bottom sheet in later iteration)
```

## Open Questions (Answered)

- [x] Place list: User will research and compile list independently
- [x] Outscraper: Will set up account at outscraper.com
- [x] Mapbox: API key available ✓

## Next Steps

Run `/workflows:plan` to create implementation plan with:
1. Database migrations (places, reviews tables)
2. Outscraper scraping instructions
3. Filter/import script
4. Mapbox map component
5. API endpoints for places
