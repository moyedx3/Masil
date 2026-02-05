# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Masil** (마실) is a GPS-verified, World ID-authenticated neighborhood review app for foreigners in Korea, built as a World Mini App for the World Build Korea 2026 hackathon.

**Deadline:** Feb 7, 2026 13:00 KST

## Tech Stack

```
Frontend:   Next.js 15 + React + Tailwind CSS
UI Kit:     @worldcoin/mini-apps-ui-kit-react
World ID:   @worldcoin/minikit-js (MiniKit SDK)
Database:   PostgreSQL (Supabase or Neon)
Maps:       Mapbox GL JS
```

## Commands

```bash
# Create project (if starting fresh)
npx @worldcoin/create-mini-app@latest masil

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Tunnel for World App testing
ngrok http 3000
```

## Architecture

### Core Concepts

- **World ID (Orb-only)**: Users identified by `nullifier_hash` - verify proofs server-side, never trust client
- **GPS Verification**: 50m radius check via `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
- **Trust Score**: 0-100 scale, starts at 50. +2 for helpful votes, -3 for not helpful

### Access Tiers

- Orb-verified users: Full access (view + post)
- Non-verified: Pay $1 USDC for view-only

### Database Tables

```sql
users            -- nullifier_hash (PK), trust_score, wallet_address
places           -- id, name, lat, lng, category
reviews          -- id, place_id, user_nullifier, content, tags[], source
helpfulness_votes -- id, review_id, voter_nullifier, is_helpful
```

Imported reviews use: `source: 'imported'`, `original_platform: 'google_maps'`

### API Endpoints

```
POST /api/auth/verify     -- Verify World ID proof
GET  /api/places          -- Get places in viewport
GET  /api/places/:id/reviews
POST /api/reviews         -- Requires GPS + auth
POST /api/reviews/:id/vote
```

## Key Patterns

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

// Haversine distance check for 50m radius
const isWithinRange = (userLat, userLng, placeLat, placeLng, maxDistance = 50) => {
  return haversineDistance(userLat, userLng, placeLat, placeLng) <= maxDistance;
};
```

## UI Design

- **Colors**: White bg (#FFFFFF), near-black text (#1A1A1A), orange accent (#FF6B35), green success (#22C55E)
- **Components**: Circular map pins with emoji, bottom sheet for place details, horizontal scroll category pills
- **Flow**: Map View → Place Detail (bottom sheet) → Add Review (modal)

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

## Constraints

- **Target area**: Jongno-gu (Insadong, Bukchon, Gwanghwamun)
- **Language**: English-only UI
- Seed data: 20-30 spots with English-language Google Maps reviews

## Documentation

- `docs/Technical PRD.md` - Full technical spec + seed data details
- `docs/Business PRD.md` - Business context, ICP, market
- `docs/hackathon related/` - Checklist, pitch deck, guidelines
- `docs/world_related/` - **World Mini App implementation guides** (reference when stuck with MiniKit/World ID)
