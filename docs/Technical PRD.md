# Masil - Technical PRD

## Overview

**Product Name**: Masil (마실)
**Platform**: World Mini App
**Target Launch**: World Build Hackathon (12-24 hours)
**Team**: Solo developer (Full-stack)

---

## Problem Statement

Foreigners living in Korea struggle to find reliable, trustworthy local information. Existing solutions (Google Maps, Naver) have:
- Reviews that can be botted or manipulated
- No identity verification for reviewers
- No way to know if reviewer actually visited the location
- Content primarily in Korean, not tailored for foreigner needs

---

## Solution

A GPS-verified, World ID-authenticated neighborhood review app where:
- Only verified humans can post reviews
- Reviews can only be posted when physically at the location
- Trust scores incentivize helpful, accurate reviews
- Content is specifically curated for foreigner needs in Korea

---

## Technical Architecture

### Platform: World Mini App

World Mini Apps are web-based applications running in World App's webview. This gives us:
- Access to 25M+ World App users
- Built-in World ID verification (Orb level)
- Native payment rails (WLD/USDC)
- GPS via standard Geolocation API
- 500 free transactions/day per user

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + React |
| Styling | Tailwind CSS + @worldcoin/mini-apps-ui-kit-react |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase/Neon) |
| Maps | Mapbox GL JS or Google Maps |
| Auth | World ID (MiniKit) |
| Payments | World Pay (MiniKit) |

### MiniKit Integration

```typescript
// Initialize MiniKit
import { MiniKitProvider } from "@worldcoin/minikit-js";

// Core commands we'll use:
// 1. verify - World ID Orb verification
// 2. pay - $1 USDC for non-verified access
// 3. walletAuth - Get user wallet address
```

---

## Core Features (MVP)

### 1. Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    App Launch                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Check World ID Status │
              └────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                              ▼
    ┌───────────────┐              ┌───────────────┐
    │ Orb Verified  │              │ Not Verified  │
    └───────────────┘              └───────────────┘
            │                              │
            ▼                              ▼
    ┌───────────────┐              ┌───────────────┐
    │ Full Access   │              │ Pay $1 USDC   │
    │ - View reviews│              │ OR            │
    │ - Post reviews│              │ Verify Orb    │
    └───────────────┘              └───────────────┘
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ View Only     │
                                   │ (if paid)     │
                                   └───────────────┘
```

**Implementation:**

```typescript
// Check verification status
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'masil-auth',
  verification_level: 'orb'
});

if (finalPayload.status === 'success') {
  // Store nullifier_hash to identify user
  await saveUser(finalPayload.nullifier_hash);
}
```

### 2. GPS Verification

Users must be within **50 meters** of a location to post a review.

```typescript
const getLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,  // Use GPS hardware
        timeout: 10000,
        maximumAge: 0  // No cached positions
      }
    );
  });
};

const isWithinRange = (
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number,
  maxDistance: number = 50  // meters
): boolean => {
  const distance = haversineDistance(userLat, userLng, placeLat, placeLng);
  return distance <= maxDistance;
};
```

### 3. Review System

**Data Model:**

```typescript
interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: 'restaurant' | 'shop' | 'service' | 'transport' | 'other';
  created_at: Date;
}

interface Review {
  id: string;
  place_id: string;
  user_nullifier: string;  // World ID nullifier hash
  content: string;  // Plain text review
  rating?: number;  // 1-5, optional
  tags: string[];  // Predefined tags
  helpful_count: number;
  not_helpful_count: number;
  created_at: Date;
  user_location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface User {
  nullifier_hash: string;  // Primary identifier
  wallet_address: string;
  trust_score: number;  // 0-100, starts at 50
  review_count: number;
  helpful_received: number;
  created_at: Date;
}

interface HelpfulnessVote {
  id: string;
  review_id: string;
  voter_nullifier: string;
  is_helpful: boolean;
  created_at: Date;
}
```

### 4. Predefined Tags

```typescript
const TAGS = {
  // Communication & Service
  communication: [
    { id: 'english_menu', label: 'English menu' },
    { id: 'english_staff', label: 'English staff' },
    { id: 'foreigner_friendly', label: 'Foreigner-friendly' },
    { id: 'card_ok', label: 'Card OK' },
    { id: 'no_korean_needed', label: 'No Korean needed' },
  ],
  // Practical
  practical: [
    { id: 'global_atm', label: 'Global ATM' },
    { id: 'vegetarian', label: 'Vegetarian options' },
    { id: 'halal', label: 'Halal' },
    { id: 'late_night', label: 'Late night' },
    { id: 'quiet_workspace', label: 'Quiet workspace' },
    { id: 'free_wifi', label: 'Free WiFi' },
  ],
  // Transport
  transport: [
    { id: 'easy_taxi', label: 'Easy taxi pickup' },
    { id: 'kakao_taxi', label: 'Kakao Taxi works' },
  ],
  // Warnings
  warnings: [
    { id: 'cash_only', label: 'Cash only' },
    { id: 'korean_only', label: 'Korean only' },
    { id: 'foreigner_markup', label: 'Foreigner markup' },
    { id: 'long_wait', label: 'Long wait' },
  ],
};
```

### 5. Trust Score System

**Calculation:**

```typescript
const calculateTrustScore = (user: User): number => {
  const BASE_SCORE = 50;

  // Each helpful vote: +2 points
  // Each not helpful vote: -3 points
  // Max: 100, Min: 0

  const helpfulPoints = user.helpful_received * 2;
  const notHelpfulPoints = user.not_helpful_received * 3;

  const score = BASE_SCORE + helpfulPoints - notHelpfulPoints;

  return Math.max(0, Math.min(100, score));
};
```

**Display tiers:**

| Score | Label | Color |
|-------|-------|-------|
| 80-100 | Trusted Local | Green |
| 60-79 | Reliable | Blue |
| 40-59 | New | Gray |
| 20-39 | Low Trust | Orange |
| 0-19 | Untrusted | Red |

### 6. Payment Flow (Non-verified users)

```typescript
const handlePayForAccess = async () => {
  const { finalPayload } = await MiniKit.commandsAsync.pay({
    reference: `access-${Date.now()}`,
    to: TREASURY_ADDRESS,  // Your wallet
    tokens: [{
      symbol: 'USDC',
      token_amount: '1.0'
    }],
    description: 'Masil - View access'
  });

  if (finalPayload.status === 'success') {
    // Verify payment on backend
    await verifyPayment(finalPayload.transaction_id);
    // Grant view access
  }
};
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify World ID proof |
| POST | `/api/auth/payment` | Verify payment for access |
| GET | `/api/places` | Get places in viewport |
| POST | `/api/places` | Create new place |
| GET | `/api/places/:id/reviews` | Get reviews for place |
| POST | `/api/reviews` | Create review (requires GPS + auth) |
| POST | `/api/reviews/:id/vote` | Vote helpful/not helpful |
| GET | `/api/users/:nullifier/profile` | Get user trust score |

---

## Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  nullifier_hash VARCHAR(66) PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  trust_score INTEGER DEFAULT 50,
  review_count INTEGER DEFAULT 0,
  helpful_received INTEGER DEFAULT 0,
  not_helpful_received INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Places table
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_location ON places USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id),
  user_nullifier VARCHAR(66) REFERENCES users(nullifier_hash),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  user_accuracy DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpfulness votes
CREATE TABLE helpfulness_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id),
  voter_nullifier VARCHAR(66) REFERENCES users(nullifier_hash),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, voter_nullifier)
);

-- Paid access (for non-verified users)
CREATE TABLE paid_access (
  wallet_address VARCHAR(42) PRIMARY KEY,
  transaction_id VARCHAR(66) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW()
);
```

---

## UI Screens

### 1. Onboarding / Auth Screen
- World ID verification prompt
- "Pay $1 for view access" alternative
- Brief explanation of the app

### 2. Map View (Main Screen)
- Mapbox/Google Maps centered on Itaewon
- Pins for places with reviews
- Pin color = average rating or review count
- Current location indicator
- Search bar at top
- "Add Review" FAB (if verified + at location)

### 3. Place Detail Screen
- Place name and category
- Tag summary (most common tags)
- List of reviews sorted by helpfulness
- Each review shows:
  - User trust score badge
  - Review text
  - Tags
  - Helpful/Not helpful buttons
  - Time posted

### 4. Add Review Screen
- GPS verification indicator
- Text input for review
- Optional star rating (1-5)
- Tag selector (multi-select)
- Submit button

### 5. Profile Screen
- Trust score (0-100) with tier label
- Review count
- Helpful votes received
- List of own reviews

---

## MVP Checklist

### Must Have (Hackathon Demo)
- [ ] World ID Orb verification
- [ ] GPS location check (50m radius)
- [ ] Map view with place pins (Jongno-gu area)
- [ ] Post text review with tags
- [ ] View others' reviews
- [ ] Helpful/Not helpful voting
- [ ] Trust score display

### Nice to Have (Stretch)
- [ ] $1 USDC paywall for non-verified viewers
- [ ] Search functionality
- [ ] AI-generated tag suggestions
- [ ] Review summary using AI

### Out of Scope (Post-Hackathon)
- [ ] Token rewards for helpful reviews
- [ ] Economic slashing for bad actors
- [ ] In-app merchant payments
- [ ] Expansion beyond Itaewon

---

## Development Timeline (12-24 hours)

| Phase | Tasks | Time |
|-------|-------|------|
| Setup | Next.js + MiniKit + DB | 2h |
| Auth | World ID integration | 2h |
| Map | Mapbox + place pins | 3h |
| Reviews | CRUD + GPS verification | 4h |
| Voting | Helpful/unhelpful + trust score | 2h |
| Polish | UI/UX + testing | 3h |
| **Total** | | **16h** |

---

## Testing

### Local Development
1. Use `npx @worldcoin/create-mini-app` template
2. Tunnel with ngrok: `ngrok http 3000`
3. Add tunnel URL to World Developer Portal
4. Scan QR code in World App to test

### Test Cases
- [ ] World ID verification flow
- [ ] GPS permission request
- [ ] GPS accuracy threshold
- [ ] Review submission at valid location
- [ ] Review blocked at invalid location
- [ ] Helpfulness voting
- [ ] Trust score calculation
- [ ] Payment flow (if implemented)

---

## Security Considerations

1. **Always verify World ID proofs server-side** - never trust client
2. **Store nullifier_hash** to prevent duplicate accounts
3. **Validate GPS on server** - client GPS can be spoofed, but combined with World ID it's much harder
4. **Rate limit reviews** - max 10 reviews per day per user
5. **Sanitize review content** - prevent XSS

---

## Seed Data Strategy

### Problem: Cold Start

An empty review app is useless. We need initial content to demonstrate value.

### Solution: Import Google Maps Reviews from Foreigners

Scrape/import English-language reviews from Google Maps for popular Jongno-gu spots.

### Filtering Logic

```typescript
import { detect } from 'langdetect';

const isForeignerReview = (review: GoogleReview): boolean => {
  // Filter 1: Non-Korean language
  const lang = detect(review.text);
  if (lang === 'ko') return false;

  // Filter 2: Minimum length (quality filter)
  if (review.text.length < 20) return false;

  return true;
};
```

### Data Model for Imported Reviews

```typescript
interface Review {
  // ... existing fields
  source: 'user' | 'imported';
  original_platform?: string;    // 'google_maps'
  original_author?: string;      // Original reviewer name (anonymized)
  imported_at?: Date;
}
```

### Database Schema Addition

```sql
ALTER TABLE reviews ADD COLUMN source VARCHAR(20) DEFAULT 'user';
ALTER TABLE reviews ADD COLUMN original_platform VARCHAR(50);
ALTER TABLE reviews ADD COLUMN original_author VARCHAR(100);
ALTER TABLE reviews ADD COLUMN imported_at TIMESTAMP;
```

### Import Sources (Pick One)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Outscraper** | 500 reviews | Best for hackathon |
| **SerpApi** | 100 searches/mo | Google Maps API |
| **Apify** | $5 credit | Pre-built scrapers |
| **Manual** | Free | Time-consuming |

### Seed Script

```typescript
// scripts/seed-reviews.ts
const JONGNO_PLACES = [
  { placeId: 'ChIJ...', name: 'Cafe ABC', category: 'cafe' },
  { placeId: 'ChIJ...', name: 'Restaurant XYZ', category: 'restaurant' },
  // ... 20-30 popular Jongno-gu spots
];

async function seedReviews() {
  const client = new Outscraper(process.env.OUTSCRAPER_API_KEY);

  for (const place of JONGNO_PLACES) {
    // Get reviews from Google Maps
    const results = await client.googleMapsReviews([place.placeId], { limit: 50 });

    // Filter for foreigner reviews
    const foreignerReviews = results
      .filter(isForeignerReview)
      .slice(0, 10); // Max 10 per place

    // Import to database
    for (const review of foreignerReviews) {
      await db.reviews.create({
        place_id: place.id,
        user_nullifier: 'IMPORTED',
        content: review.text,
        rating: review.rating,
        tags: autoDetectTags(review.text), // AI tag detection
        source: 'imported',
        original_platform: 'google_maps',
        original_author: anonymize(review.author),
        imported_at: new Date(),
      });
    }
  }
}
```

### Auto-Tag Detection

```typescript
const TAG_KEYWORDS = {
  'english_menu': ['english menu', 'menu in english'],
  'english_staff': ['speak english', 'english speaking', 'staff speaks'],
  'free_wifi': ['wifi', 'wi-fi', 'internet'],
  'card_ok': ['card', 'credit card', 'visa', 'mastercard'],
  'vegetarian': ['vegetarian', 'vegan', 'veggie'],
  'foreigner_friendly': ['foreigner', 'tourist', 'expat friendly'],
};

const autoDetectTags = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  return Object.entries(TAG_KEYWORDS)
    .filter(([_, keywords]) => keywords.some(k => lowerText.includes(k)))
    .map(([tag, _]) => tag);
};
```

### UI Display for Imported Reviews

```
┌──────────────────────────────────────┐
│  [G] J***n D.          📥 Imported   │
│      from Google Maps                │
│                                      │
│  "Great coffee, staff speaks English │
│   and they have a nice terrace."     │
│                                      │
│  [English staff] [Free WiFi]         │
│                                      │
│  [👍 Helpful] [👎 Not helpful]       │
└──────────────────────────────────────┘
```

- Show "Imported" badge
- Anonymize author name (J***n D.)
- Still allow voting (helps surface good imported reviews)
- No Trust Score for imported reviews

### Target: 20-30 Jongno-gu Spots

Categories to seed:
- 5-8 cafes (Insadong, Bukchon area)
- 5-8 restaurants
- 3-5 bars
- 3-5 shops/services
- 2-3 transport spots (stations with foreigner tips)

---

## Resources

- [World Mini Apps Docs](https://docs.world.org/mini-apps)
- [World ID Docs](https://docs.world.org/world-id/concepts)
- [MiniKit SDK](https://www.npmjs.com/package/@worldcoin/minikit-js)
- [Next.js Template](https://github.com/worldcoin/minikit-nextjs-template)
- [Outscraper API](https://outscraper.com/) - For seed data
