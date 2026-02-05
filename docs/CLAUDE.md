# Masil

Neighborhood review app for foreigners in Korea. Built as a **World Mini App** for World Build Korea 2026 hackathon.

## What This Is

A GPS-verified, World ID-authenticated review platform where:
- Only Orb-verified humans can post reviews
- Must be within 50m of location to post
- Trust scores track reviewer reputation
- Seed data imported from Google Maps (foreigner reviews only)

## Tech Stack

```
Frontend:   Next.js 15 + React + Tailwind
UI Kit:     @worldcoin/mini-apps-ui-kit-react
World ID:   @worldcoin/minikit-js (MiniKit SDK)
Database:   PostgreSQL (Supabase or Neon)
Maps:       Mapbox GL JS
Seed Data:  Outscraper or SerpApi (Google Maps reviews)
```

## Key Technical Decisions

### World ID
- **Orb-only verification** - No device verification. One person = one account.
- User identified by `nullifier_hash` (anonymous unique ID per app)
- Always verify proofs server-side, never trust client

### GPS
- Use `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
- 50m radius check before allowing review post
- GPS can be spoofed, but combined with World ID makes mass manipulation impractical

### Access Tiers
- **Verified users**: Full access (view + post reviews)
- **Non-verified**: Pay $1 USDC for view-only access

### Trust Score
- Range: 0-100, starts at 50
- +2 for "helpful" votes, -3 for "not helpful"
- Display tiers: Trusted (80+), Reliable (60-79), New (40-59), Low (20-39), Untrusted (0-19)

## Seed Data Strategy

Bootstrap initial reviews by importing English-language reviews from Google Maps:
1. Use Outscraper/SerpApi for 20-30 Jongno-gu spots (Insadong, Bukchon area)
2. Filter: keep only non-Korean language reviews
3. Auto-detect tags from text (English menu, WiFi, card OK, etc.)
4. Store with `source: 'imported'`, `original_platform: 'google_maps'`
5. Display with "Imported" badge, no Trust Score

## UI Design (Reference: Corner Maps)

### Styling
```
Background:     #FFFFFF (white)
Text Primary:   #1A1A1A (near black)
Accent:         #FF6B35 (orange - warnings, closed)
Success:        #22C55E (green - open, verified)
Primary CTA:    Blue gradient (#3B82F6 → #8B5CF6)
```

### Components
- **Map pins**: Circular with emoji (☕🍽️🛍️), selected = larger with ring
- **Bottom sheet**: Place details slide up, map visible above
- **Category filter**: Horizontal scroll pills (eat, cafes, bars, shops...)
- **Review cards**: Avatar + username + Trust Score badge + text + tags
- **Buttons**: Pill-shaped, rounded corners everywhere (12-16px)

### Screen Flow
```
Map View (main) → Place Detail (bottom sheet) → Add Review (modal)
                         ↓
                  Reviews List (scroll)
```

## MVP Features

### Must Have
- [ ] World ID Orb verification
- [ ] GPS location check (50m radius)
- [ ] Map view with emoji pins (Jongno-gu)
- [ ] Place detail bottom sheet
- [ ] Post review with tags
- [ ] View reviews (imported + user)
- [ ] Helpful/Not helpful voting
- [ ] Trust score display

### Nice to Have
- [ ] $1 USDC paywall for non-verified
- [ ] Search
- [ ] Category filters

## Important Patterns

```typescript
// World ID verification
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'masil-auth',
  verification_level: 'orb'
});

// GPS with high accuracy
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
});

// Filter foreigner reviews (seed data)
const isForeignerReview = (text: string) => {
  const lang = detect(text);
  return lang !== 'ko' && text.length > 20;
};
```

## Database Tables

```sql
users            -- nullifier_hash (PK), trust_score, wallet_address
places           -- id, name, lat, lng, category
reviews          -- id, place_id, user_nullifier, content, tags[], source
helpfulness_votes -- id, review_id, voter_nullifier, is_helpful
```

Key fields for imported reviews:
- `source`: 'user' | 'imported'
- `original_platform`: 'google_maps'
- `original_author`: anonymized name

## Project Files

```
masil/
├── CLAUDE.md                 # This file
├── Technical PRD.md          # Full technical spec + seed data details
├── Business PRD.md           # Business context, ICP, market
├── Hackathon Checklist.md    # Quick reference, dev order
├── Pitch Deck Outline.md     # 5-min presentation script
├── Hackathon Guidelines (Raw).md
└── reference_image/          # Corner Maps screenshots (UI reference)
```

## Development Order

1. Project setup + MiniKit
2. Database schema
3. Seed data script (import Google Maps reviews)
4. World ID auth flow
5. Map view + pins
6. Place detail + reviews list
7. Add review + GPS check
8. Voting + Trust score
9. UI polish
10. Demo video + slides

## Constraints

- **Timeline**: 12-24 hours, solo developer
- **Target area**: Jongno-gu (Insadong, Bukchon, Gwanghwamun)
- **Language**: English-only UI
- **Deadline**: Feb 7, 2026 13:00 KST

## Resources

- [World Mini Apps Docs](https://docs.world.org/mini-apps)
- [World ID Docs](https://docs.world.org/world-id/concepts)
- [MiniKit SDK](https://www.npmjs.com/package/@worldcoin/minikit-js)
- [Outscraper](https://outscraper.com/) - Google Maps review scraping
