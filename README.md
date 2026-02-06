# Masil (마실)

**GPS-verified, World ID-authenticated neighborhood reviews for foreigners in Korea.**

> "마실" is a traditional Korean word meaning "a casual stroll to a neighbor's house" - wandering your neighborhood to connect with your community.

<img width="300" alt="showcase_1" src="https://github.com/user-attachments/assets/5b28aa15-c49a-4dab-b2f0-b565158b8d92" /> <img width="300" alt="showcase_2" src="https://github.com/user-attachments/assets/60dfb4ad-92c0-4712-9d3a-73410a777a37" /> <img width="300" alt="showcase_3" src="https://github.com/user-attachments/assets/65cdcc31-c221-48f8-ba23-aac5eeeaf8d9" />



## The Problem

Foreigners in Korea struggle to find trustworthy local information. Google Maps reviews can be botted, Naver is in Korean, and Facebook groups are unstructured. There's no way to know if a reviewer is a real person or if they actually visited the place.

## The Solution

Masil is the first review platform where:
- **Only verified humans can post** - World ID Orb verification
- **Reviewers must be physically present** - GPS check within 50m
- **Community self-moderates** - Trust scores reward helpful reviewers

## How It Works

1. **Verify** - Prove you're human with World ID (Orb level)
2. **Visit** - Go to a place in Jongno-gu, Seoul
3. **Review** - Post a GPS-verified review while you're there

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS |
| Auth | World ID via MiniKit SDK |
| Database | PostgreSQL (Supabase) |
| Maps | Mapbox GL JS |
| Payments | World Pay (USDC) |
| Platform | World Mini App |

## Features

- **Map view** with category-filtered place pins (cafes, restaurants, ATMs, pharmacies, hospitals)
- **Place detail** bottom sheet with reviews, tags, and directions
- **GPS-verified reviews** - must be within 50m to post
- **Foreigner-specific tags** - English menu, English staff, card OK, free WiFi, etc.
- **Trust score system** - 0-100 reputation based on community votes
- **Helpfulness voting** - upvote/downvote reviews
- **Imported reviews** - seeded with filtered English-language Google Maps reviews
- **Two access tiers** - Orb-verified (full access) or paid view-only ($0.10 USDC)
- **User profiles** - stats, reviews, trust badge

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Mapbox token
- World ID app (via [Developer Portal](https://developer.worldcoin.org))

### Setup

```bash
# Clone
git clone https://github.com/your-username/masil.git
cd masil/app

# Install dependencies
pnpm install

# Copy env template and fill in values
cp .env.local.example .env.local

# Run database migrations
# Apply files in supabase/migrations/ to your Supabase project

# Run dev server
pnpm dev
```

### Environment Variables

```
APP_ID=                          # World ID app ID
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SECRET_KEY=             # Supabase service role key
NEXT_PUBLIC_MAPBOX_TOKEN=        # Mapbox access token
NEXT_PUBLIC_PAYMENT_ADDRESS=     # Wallet address for USDC payments
DEV_PORTAL_API_KEY=              # World Developer Portal API key
```

### Seed Data

```bash
# Scrape Google Maps reviews (requires Outscraper API key)
pnpm scrape-places

# Filter for foreigner-only English reviews
pnpm filter-reviews

# Import to Supabase
pnpm import-seed
```

### Testing with World App

```bash
# Start tunnel
ngrok http 3000

# Add the tunnel URL to your World Developer Portal app config
# Open World App > Mini Apps > scan QR code
```

## Project Structure

```
app/
├── app/
│   ├── (main)/              # Main app routes (with bottom nav)
│   │   ├── home/            # Map view (main screen)
│   │   ├── profile/         # User profile
│   │   └── about/           # Help & FAQ
│   ├── api/                 # API routes
│   │   ├── auth/            # verify, check, signout, payment
│   │   ├── places/          # list places, place reviews
│   │   ├── reviews/         # create review, vote
│   │   └── user/            # user profile
│   ├── components/          # React components
│   └── page.tsx             # Landing / splash screen
├── lib/
│   ├── db.ts                # Database types & Supabase client
│   └── geo.ts               # Haversine distance calculation
├── scripts/                 # Data import pipeline
├── supabase/migrations/     # SQL schema migrations
└── public/icons/            # Category SVG icons
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/verify` | - | Verify World ID proof |
| GET | `/api/auth/check` | Cookie | Check auth status |
| POST | `/api/auth/signout` | Cookie | Sign out |
| POST | `/api/auth/initiate-payment` | - | Start USDC payment |
| POST | `/api/auth/payment` | - | Verify USDC payment |
| GET | `/api/places` | - | List all places |
| GET | `/api/places/[id]/reviews` | Optional | Get place details + reviews |
| POST | `/api/reviews` | Required | Create review (GPS verified) |
| POST | `/api/reviews/[id]/vote` | Required | Vote helpful/not helpful |
| GET | `/api/user/profile` | Required | Get user profile + stats |

## Trust Score

Every user starts at **50**. The score adjusts based on community feedback:

| Action | Effect |
|--------|--------|
| Review voted helpful | +2 |
| Review voted not helpful | -3 |

| Score | Tier |
|-------|------|
| 80-100 | Trusted Local |
| 60-79 | Reliable |
| 40-59 | New User |
| 20-39 | Low Trust |
| 0-19 | Untrusted |

## Target Area

Jongno-gu, Seoul - specifically Insadong, Bukchon, and Gwanghwamun. Seeded with 20-30 popular spots with English-language reviews from Google Maps.

## Built For

[World Build Korea 2026](https://world.org) Hackathon

## License

MIT
