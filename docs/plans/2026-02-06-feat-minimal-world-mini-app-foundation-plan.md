---
title: "feat: Minimal World Mini App Foundation"
type: feat
date: 2026-02-06
deadline: 2026-02-07 13:00 KST
---

# feat: Minimal World Mini App Foundation

## Overview

Bootstrap a working World Mini App with real World ID authentication as the foundation for Masil. This establishes the full-stack architecture that can be extended with map, reviews, and other features.

## Problem Statement / Motivation

- **Deadline**: Feb 7, 2026 13:00 KST (~27 hours)
- **Current state**: Documentation only, zero code exists
- **Goal**: Working app with real World ID auth that proves the concept and can be demoed

## Proposed Solution

Create the minimal viable World Mini App with:
1. Next.js 15 project scaffolded via `@worldcoin/create-mini-app`
2. Working World ID Orb verification
3. PostgreSQL database (Supabase) for user storage
4. Basic UI showing auth state

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  World App                       │
│  ┌───────────────────────────────────────────┐  │
│  │            Masil Mini App                  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │   Next.js 15 + MiniKitProvider      │  │  │
│  │  │   ┌─────────┐    ┌──────────────┐   │  │  │
│  │  │   │  Auth   │    │   Home Page  │   │  │  │
│  │  │   │  Page   │───▶│  (protected) │   │  │  │
│  │  │   └────┬────┘    └──────────────┘   │  │  │
│  │  │        │                             │  │  │
│  │  │        ▼                             │  │  │
│  │  │   ┌─────────────────────────────┐   │  │  │
│  │  │   │      API Routes             │   │  │  │
│  │  │   │  /api/auth/verify           │   │  │  │
│  │  │   │  /api/auth/nonce            │   │  │  │
│  │  │   └───────────┬─────────────────┘   │  │  │
│  │  │               │                      │  │  │
│  │  └───────────────┼──────────────────────┘  │  │
│  └──────────────────┼─────────────────────────┘  │
└─────────────────────┼────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   Supabase    │
              │  PostgreSQL   │
              │  ┌─────────┐  │
              │  │ users   │  │
              │  └─────────┘  │
              └───────────────┘
```

### File Structure

```
app/
├── layout.tsx              # MiniKitProvider wrapper
├── page.tsx                # Landing/auth page
├── providers.tsx           # Client-side providers
├── globals.css             # Tailwind + custom styles
├── home/
│   └── page.tsx            # Authenticated home (protected)
└── api/
    └── auth/
        ├── verify/route.ts # World ID proof verification
        └── nonce/route.ts  # SIWE nonce generation
lib/
├── db.ts                   # Supabase client
└── auth.ts                 # Auth helpers
```

## Implementation Phases

### Phase 1: Project Scaffold

**Tasks:**
- [x] Run `npx @worldcoin/create-mini-app@latest` in `/home/kkang/masil/app`
- [x] Verify MiniKitProvider is set up in layout.tsx
- [x] Install additional deps: `@supabase/supabase-js`
- [x] Create `.env.local` with required variables
- [x] Test dev server runs: `pnpm dev`

**Files created:**
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `package.json`
- `.env.local`

**Acceptance:**
- `pnpm dev` starts without errors
- App renders in browser at localhost:3000

---

### Phase 2: Database Setup

**Tasks:**
- [x] Create Supabase project (or use existing)
- [x] Create `users` table with migration
- [x] Set up Supabase client in `lib/db.ts`
- [ ] Test connection (needs your Supabase credentials)

**SQL Migration:**
```sql
-- Create users table
CREATE TABLE users (
  nullifier_hash VARCHAR(66) PRIMARY KEY,
  wallet_address VARCHAR(42),
  trust_score INTEGER DEFAULT 50,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT
  USING (true);

-- Allow insert from authenticated requests (will use service key)
CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  WITH CHECK (true);
```

**Files created:**
- `lib/db.ts`
- `supabase/migrations/001_create_users.sql`

**Acceptance:**
- Can connect to Supabase from app
- Users table exists and accepts inserts

---

### Phase 3: World ID Auth Flow

**Tasks:**
- [x] Create `/api/auth/nonce` endpoint for SIWE
- [x] Create `/api/auth/verify` endpoint for World ID proof
- [x] Create auth page with verify button
- [x] Handle verification states (loading, success, error)
- [x] Store verified user in database
- [x] Create session/cookie for auth state

**API: /api/auth/nonce/route.ts**
```typescript
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, '');

  cookies().set('siwe-nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5, // 5 minutes
  });

  return NextResponse.json({ nonce });
}
```

**API: /api/auth/verify/route.ts**
```typescript
import { verifyCloudProof, ISuccessResult } from '@worldcoin/minikit-js';
import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { payload, action } = await req.json();

  const app_id = process.env.APP_ID as `app_${string}`;

  const verifyRes = await verifyCloudProof({
    proof: payload as ISuccessResult,
    app_id,
    action,
  });

  if (!verifyRes.success) {
    return NextResponse.json(
      { verified: false, error: verifyRes.code },
      { status: 400 }
    );
  }

  // Create or get user
  const user = await getUser(payload.nullifier_hash)
    || await createUser(payload.nullifier_hash);

  // Set auth cookie
  const response = NextResponse.json({
    verified: true,
    user
  });

  response.cookies.set('auth', payload.nullifier_hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
```

**Frontend: app/page.tsx**
```typescript
'use client';

import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useState } from 'react';

export default function AuthPage() {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      alert('Please open in World App');
      return;
    }

    setStatus('verifying');

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: 'masil-auth',
        verification_level: VerificationLevel.Orb,
      });

      if (finalPayload.status === 'error') {
        setStatus('error');
        return;
      }

      // Verify on backend
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: finalPayload,
          action: 'masil-auth',
        }),
      });

      if (res.ok) {
        setStatus('success');
        window.location.href = '/home';
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Masil</h1>
      <p className="text-gray-600 mb-8">Verified neighborhood reviews</p>

      <button
        onClick={handleVerify}
        disabled={status === 'verifying'}
        className="bg-black text-white px-8 py-3 rounded-full"
      >
        {status === 'verifying' ? 'Verifying...' : 'Verify with World ID'}
      </button>

      {status === 'error' && (
        <p className="text-red-500 mt-4">Verification failed. Try again.</p>
      )}
    </main>
  );
}
```

**Files created:**
- `app/api/auth/nonce/route.ts`
- `app/api/auth/verify/route.ts`
- `app/page.tsx` (updated)
- `lib/auth.ts`

**Acceptance:**
- Clicking "Verify with World ID" triggers World App verification
- Successful verification stores user in DB
- User is redirected to /home
- Auth cookie is set

---

### Phase 4: Protected Home Page

**Tasks:**
- [x] Create `/home/page.tsx` as protected route
- [x] Add middleware to check auth cookie
- [x] Display user info (nullifier hash truncated, trust score)
- [x] Add sign out functionality

**Middleware: middleware.ts**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('auth');

  if (request.nextUrl.pathname.startsWith('/home')) {
    if (!auth) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*'],
};
```

**Files created:**
- `app/home/page.tsx`
- `middleware.ts`

**Acceptance:**
- Unauthenticated users redirected to /
- Authenticated users see home page
- Sign out clears cookie and redirects

---

## Environment Variables

```env
# .env.local
APP_ID=app_xxx                    # From World Developer Portal
DEV_PORTAL_API_KEY=xxx            # For cloud proof verification

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx          # Server-side only
```

## Acceptance Criteria

- [x] App scaffolded with `@worldcoin/create-mini-app`
- [x] MiniKitProvider wraps the app
- [ ] World ID Orb verification works end-to-end (needs testing)
- [ ] User stored in Supabase on first verification (needs credentials)
- [x] Auth state persisted via cookie
- [x] Protected route `/home` requires auth
- [ ] Works when tested via ngrok/Railway in World App (needs deployment)

## Testing Workflow

1. Start dev server: `pnpm dev`
2. Start tunnel: `ngrok http 3000`
3. Add ngrok URL to World Developer Portal
4. Scan QR code with World App
5. Test verification flow

## Dependencies

**Required before starting:**
- [ ] World Developer Portal account
- [ ] App created in Developer Portal with `masil-auth` action
- [ ] Supabase project created
- [ ] ngrok installed

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Developer Portal setup issues | Blocks auth | Create app/action early, test with mock first |
| Supabase connection issues | Blocks user storage | Use hardcoded mock data as fallback |
| MiniKit API changes | Code doesn't work | Use Context7 docs (verified 2026 patterns) |

---

## Edge Cases & Decisions (from SpecFlow Analysis)

### Handled in This Plan

| Edge Case | Decision |
|-----------|----------|
| User opens in regular browser | Show "Open in World App" message (check `MiniKit.isInstalled()`) |
| User cancels verification | Show error, allow retry |
| Returning user with valid cookie | Middleware allows through to /home |
| DB write fails after verification | Return error, don't set cookie (user must retry) |
| Race condition on user creation | Use `upsert` with `ON CONFLICT DO NOTHING` |

### Deferred to Post-MVP

| Edge Case | Reason |
|-----------|--------|
| Cookie security (JWT signing) | Hackathon MVP - accept risk, nullifier is not secret |
| Device-only verification users | Show generic error for now |
| Session refresh mechanism | 7-day cookie is sufficient for hackathon |
| Rate limiting | Low traffic expected |

### Implementation Notes

**MiniKit initialization timing:**
```typescript
// Wait for MiniKit to initialize before checking
const waitForMiniKit = async (maxWait = 2000) => {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (MiniKit.isInstalled()) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return MiniKit.isInstalled();
};
```

**Upsert for race-safe user creation:**
```typescript
const { data, error } = await supabase
  .from('users')
  .upsert(
    { nullifier_hash, wallet_address },
    { onConflict: 'nullifier_hash', ignoreDuplicates: true }
  )
  .select()
  .single();
```

**Sign out endpoint (add to Phase 4):**
```typescript
// app/api/auth/signout/route.ts
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth');
  return response;
}
```

## References

### Internal
- `/home/kkang/masil/CLAUDE.md` - Project conventions
- `/home/kkang/masil/docs/Technical PRD.md` - Full spec
- `/home/kkang/masil/docs/world_related/World Mini App Implementation Guide.md` - MiniKit patterns

### External
- [MiniKit JS Docs](https://docs.world.org/mini-apps) - Official documentation
- [World Developer Portal](https://developer.worldcoin.org) - App registration
- [Context7 MiniKit](https://context7.com/worldcoin/minikit-js) - Verified code examples
