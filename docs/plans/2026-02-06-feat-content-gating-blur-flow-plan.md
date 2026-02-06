---
title: "feat: Content Gating — Gate at Content, Not Entry"
type: feat
date: 2026-02-06
brainstorm: docs/brainstorms/2026-02-06-content-gating-blur-flow-brainstorm.md
---

# feat: Content Gating — Gate at Content, Not Entry

## Overview

Shift Masil from "auth wall at app entry" to "browse freely, gate at review content." Anyone can open the app, see the map, and tap places. Review **text** is blurred until the user either verifies with World ID (full access) or pays $1 USDC (view-only).

## Problem Statement

Currently, users hit an auth wall on the landing page before seeing anything. This creates friction — users don't know what they're signing up for. By letting them browse first and gating at the review content, we create a freemium funnel that shows value before asking for commitment.

## Proposed Solution

**Client-side blur approach**: API returns full review data to everyone. The client blurs review text based on auth state. After verification/payment, reviews unblur instantly in-place (no reload).

**Three access tiers**: Anonymous (blurred), Paid (view-only), Orb-verified (full access).

## Access Tier Matrix

| Action | Anonymous | Paid ($1 USDC) | Orb Verified |
|--------|-----------|----------------|--------------|
| Browse map | Yes | Yes | Yes |
| See place info | Yes | Yes | Yes |
| See star ratings | Yes | Yes | Yes |
| Read review text | **Blurred** | Yes | Yes |
| Vote on reviews | Hidden | Hidden | Yes |
| Write review | Prompt verify | Prompt verify | Yes |
| Profile page | No | No | Yes |

## Acceptance Criteria

- [ ] Anonymous users can open app, see map, tap places, see place info + star ratings
- [ ] Review text is CSS-blurred for anonymous users; metadata (stars, author, tags) visible
- [ ] First review slot replaced with unlock CTA card (Verify / Pay $1)
- [ ] World ID verification from CTA unblurs reviews instantly (no navigation)
- [ ] $1 USDC payment from CTA unblurs reviews instantly (view-only access)
- [ ] "Write Review" button visible to all, triggers verify prompt for non-orb users
- [ ] Vote buttons hidden for non-orb users
- [ ] Return visitors with valid cookie see unblurred reviews immediately
- [ ] Sign out / profile buttons only shown to authenticated users

---

## Implementation Phases

### Phase 1: Open the Gates (Remove Entry Auth Wall)

**Files to modify:**

#### `middleware.ts` (lines 4-20)

Remove the hard block on `/home`. Allow everyone through. Keep the authenticated-user redirect from `/` to `/home`.

**Before:**
```
/ → if auth cookie → redirect /home
/home → if NO auth cookie → redirect /
```

**After:**
```
/ → if auth cookie → redirect /home
/home → allow everyone through (no auth check)
```

#### `app/page.tsx` (lines 1-108)

Simplify the landing page. After splash screen:
- If MiniKit not installed → show QR code (keep existing)
- If auth cookie exists → redirect to `/home` (keep existing)
- If no auth → **redirect to `/home` anyway** (NEW — everyone goes to map)

Remove the `"auth-gate"` state entirely from the landing page. The AuthGate now lives inside the bottom sheet.

#### `app/api/places/route.ts` (lines 6-12)

Remove auth check. Places are public data.

#### `app/api/places/[id]/reviews/route.ts` (lines 15-21, 66-70)

Make auth **optional**. If auth cookie present, fetch user votes. If not, return empty votes and `currentUserNullifier: null`.

**Change:**
```typescript
// Remove the 401 block. Make auth optional:
const auth = req.cookies.get("auth");
const currentUserNullifier = auth?.value || null;
const userVotes = currentUserNullifier
  ? await getUserVotes(currentUserNullifier, reviewIds)
  : [];
```

---

### Phase 2: Auth State in Home Page

#### `app/home/page.tsx`

Add auth state management. On mount, check `/api/auth/check` to determine access tier.

**New state:**
```typescript
type AuthTier = "anonymous" | "paid" | "orb";
const [authTier, setAuthTier] = useState<AuthTier>("anonymous");
```

**On mount:** Call `/api/auth/check`. If authenticated, check tier. Set state accordingly.

**Header changes:**
- Anonymous: Show only logo (no sign out, no profile button)
- Authenticated: Show logo + verified badge + profile + sign out (existing)

**Pass `authTier` down** to `PlaceDetail` as a new prop.

**Add `handleAuthSuccess` callback** that:
1. Sets `authTier` to `"orb"` or `"paid"`
2. Re-fetches current place reviews (to get user votes if now orb-verified)

---

### Phase 3: Blur Reviews + Unlock CTA

#### `app/components/ReviewCard.tsx`

Add a `blurred` prop:

```typescript
interface ReviewCardProps {
  // ... existing props
  blurred?: boolean;
}
```

When `blurred === true`:
- Star rating: **visible** (no change)
- Author name, imported badge, timestamp: **visible** (no change)
- Review text `<p>`: add `select-none filter blur-[6px]` classes
- Tags: **visible** (no change)
- Vote buttons: **hidden** (don't render `<VoteButtons>`)
- "Read more" button: **hidden**

#### `app/components/PlaceDetail.tsx`

Add `authTier` and `onRequestAuth` props:

```typescript
interface PlaceDetailProps {
  // ... existing props
  authTier?: "anonymous" | "paid" | "orb";
  onRequestAuth?: () => void;
}
```

**Changes to review list rendering:**

When `authTier === "anonymous"`:
1. **First slot**: Render an `UnlockCTA` card (new inline component) instead of the first review
2. **Remaining reviews**: Render `<ReviewCard blurred={true} />` with no vote buttons
3. **"Write Review" button**: Still visible, but `onClick` calls `onRequestAuth` instead of `onAddReview`

When `authTier === "paid"`:
1. All reviews render normally (unblurred)
2. Vote buttons hidden (`<ReviewCard>` rendered without vote props)
3. **"Write Review" button**: Visible, `onClick` calls `onRequestAuth` (prompts World ID)

When `authTier === "orb"`:
1. Everything renders as it does today (full access)

#### `UnlockCTA` — Inline in PlaceDetail

A card that replaces the first review slot for anonymous users:

```
┌──────────────────────────────┐
│  🔒  Unlock Reviews          │
│                              │
│  Verify you're human to read │
│  trusted neighborhood reviews│
│                              │
│  [Verify with World ID]      │  ← primary button
│  [Pay $1 to Read]            │  ← secondary button
└──────────────────────────────┘
```

- "Verify with World ID" → calls `onRequestAuth` with mode `"verify"`
- "Pay $1 to Read" → calls `onRequestAuth` with mode `"pay"`

---

### Phase 4: In-Place Auth Modal

#### `app/home/page.tsx` — Auth modal state

Add modal state:
```typescript
const [showAuthModal, setShowAuthModal] = useState(false);
const [authMode, setAuthMode] = useState<"verify" | "pay">("verify");
```

When `onRequestAuth` is called from PlaceDetail:
- Set `showAuthModal = true`
- Set `authMode` based on which button was clicked

Render a modal overlay (not the full-page AuthGate) with:
- World ID verify flow (reuse `handleVerify` logic from AuthGate)
- OR $1 USDC payment flow (new)

**On success:**
- Close modal
- Update `authTier` state
- Reviews unblur instantly (React re-render, no navigation)
- If the user was orb-verified, re-fetch place data to get `currentUserNullifier` for votes

#### Auth Modal Component

Extract verification + payment logic into a compact modal. Simpler than AuthGate — no logo, no FAQ, just the action:

```
┌─────────────────────────────────┐
│  ✕ (close)                      │
│                                 │
│  [World ID icon]                │
│  Verify to unlock reviews       │
│                                 │
│  [Verify with World ID]         │
│                                 │
│  ─── or ───                     │
│                                 │
│  [Pay $1 USDC]                  │
│                                 │
│  (error / loading states)       │
└─────────────────────────────────┘
```

---

### Phase 5: $1 USDC Payment Flow

#### Database: Add `access_tier` to users table

New migration `006_add_access_tier.sql`:

```sql
ALTER TABLE users ADD COLUMN access_tier TEXT NOT NULL DEFAULT 'orb'
  CHECK (access_tier IN ('orb', 'paid'));
```

Existing users (orb-verified) get `'orb'` default. New paid users get `'paid'`.

#### `app/api/auth/payment/route.ts` (NEW)

Single endpoint that handles payment initiation + verification:

1. Client calls `MiniKit.commandsAsync.pay()` with:
   - `reference`: UUID generated client-side
   - `to`: recipient wallet address (env var `NEXT_PUBLIC_PAYMENT_ADDRESS`)
   - `tokens`: `[{ symbol: Tokens.USDC, token_amount: tokenToDecimals(1, Tokens.USDC) }]`
   - `description`: "Masil - View-only review access"

2. On success, client POSTs `{ transaction_id, reference }` to `/api/auth/payment`

3. Server verifies with World API:
   ```
   GET https://developer.worldcoin.org/api/v2/minikit/transaction/{transaction_id}?app_id={APP_ID}&type=payment
   ```

4. If valid: create user record with `access_tier: 'paid'`, set auth cookie, return success.

5. Client updates `authTier` → reviews unblur.

**Note:** Paid users don't have a `nullifier_hash` from World ID. Use the wallet address from the payment as their identifier. Store in `users.wallet_address` with `nullifier_hash` set to a generated value like `paid_${wallet_address}`.

#### `app/api/auth/check/route.ts`

Update to return `access_tier` in the response:
```typescript
return NextResponse.json({
  authenticated: true,
  access_tier: user.access_tier, // 'orb' | 'paid'
  user: { ... }
});
```

---

### Phase 6: Wire It All Together

#### `app/home/page.tsx` — Full integration

1. **On mount**: Check auth → set `authTier`
2. **Map renders** for everyone (places fetched without auth)
3. **Place tap** → fetch reviews (no auth required) → open bottom sheet
4. **PlaceDetail** renders with `authTier` prop:
   - Anonymous → blurred reviews + unlock CTA
   - Paid → clear reviews, no votes, write prompts verify
   - Orb → full access (existing behavior)
5. **Unlock CTA tap** → open auth modal
6. **Auth modal success** → update `authTier` → reviews unblur in-place
7. **"Write Review" tap** (anonymous/paid) → open auth modal in verify mode

---

## File Change Summary

| File | Change | Effort |
|------|--------|--------|
| `middleware.ts` | Remove `/home` auth block | Small |
| `app/page.tsx` | Remove auth-gate state, redirect everyone to `/home` | Small |
| `app/api/places/route.ts` | Remove auth check (L6-12) | Small |
| `app/api/places/[id]/reviews/route.ts` | Make auth optional (L15-21) | Small |
| `app/api/auth/check/route.ts` | Add `access_tier` to response | Small |
| `app/api/auth/payment/route.ts` | **NEW** — USDC payment verification | Medium |
| `app/home/page.tsx` | Add authTier state, auth modal, conditional header | Medium |
| `app/components/PlaceDetail.tsx` | Add authTier prop, UnlockCTA, conditional rendering | Medium |
| `app/components/ReviewCard.tsx` | Add `blurred` prop, CSS blur on text | Small |
| `supabase/migrations/006_add_access_tier.sql` | **NEW** — add access_tier column | Small |

**No changes needed:**
- `BottomSheet.tsx` — works as-is
- `Map.tsx` — works as-is
- `AddReviewModal.tsx` — already gated by parent
- `VoteButtons.tsx` — hidden by parent when blurred
- `SplashScreen.tsx` — works as-is
- `TrustBadge.tsx`, `StarRating.tsx`, `TagSelector.tsx`, `GPSStatus.tsx` — unchanged

---

## Environment Variables Needed

```env
# Payment recipient wallet (must be whitelisted in World Developer Portal)
NEXT_PUBLIC_PAYMENT_ADDRESS=0xYourWalletAddress
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User cancels World ID modal | Modal closes, CTA remains, user can retry |
| User cancels payment | Modal closes, CTA remains, user can retry |
| MiniKit not installed | QR code page shown (existing behavior) |
| Payment succeeds but verify API slow | Show loading spinner, accept "pending" status as success |
| Cookie expired on return visit | Reviews re-blur, CTA shown again |
| Paid user taps "Write Review" | Auth modal opens in verify-only mode |
| Network error during verify/pay | Error message in modal with retry button |

---

## Testing Checklist

- [ ] Anonymous user: map loads, places visible, reviews blurred
- [ ] Anonymous user: unlock CTA appears as first review slot
- [ ] World ID verify from CTA: reviews unblur instantly
- [ ] $1 USDC payment from CTA: reviews unblur instantly
- [ ] Paid user: can read reviews, cannot vote, write prompts verify
- [ ] Orb user: full access (read, write, vote) — no regression
- [ ] Return visit (orb): reviews visible immediately
- [ ] Return visit (paid): reviews visible, write prompts verify
- [ ] Sign out: reviews re-blur on next place tap
- [ ] Mobile: bottom sheet + blur + CTA works on touch
