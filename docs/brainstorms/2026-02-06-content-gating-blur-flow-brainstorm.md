# Brainstorm: Content Gating — Gate at Content, Not Entry

**Date:** 2026-02-06
**Status:** Decided
**Next:** `/workflows:plan`

---

## What We're Building

Shift the app from "auth wall at entry" to "browse freely, gate at review content." Anyone can open Masil, see the map, tap places, and see place info + star ratings. But the actual review **text** is blurred until the user either:

1. **Verifies with World ID (Orb)** — full access (read + write + vote)
2. **Pays $1 USDC** — view-only access (read reviews, no posting)

This is a freemium funnel: let users see value (the map, the places, the ratings) before asking them to commit.

---

## Why This Approach

- **Lower friction**: Users explore freely, build curiosity, THEN convert
- **Better demo**: Judges see the full map experience immediately, then witness the verify/pay unlock moment
- **Standard pattern**: Blurred content is a well-understood paywall UX (Glassdoor, LinkedIn, etc.)

---

## Key Decisions

### 1. What's visible without auth
- Place name, category, address, directions button — **fully visible**
- Star ratings per review — **fully visible**
- Review author (anonymized), tags, imported badge — **fully visible**
- Review **text content** — **blurred (CSS `filter: blur`)**
- Vote buttons — **hidden** (requires auth to vote)

### 2. CTA placement
- **First review slot** is replaced with an unlock CTA card
- Card has two buttons: "Verify with World ID" (primary) and "Pay $1 to Read" (secondary)
- Remaining reviews shown below with blurred text

### 3. Post-auth transition
- **Instant unblur in-place** — no navigation, no reload
- Auth state updates in React, reviews animate from blurred to clear
- Bottom sheet stays open at same scroll position

### 4. Write review button
- **Visible to everyone**, but tapping it triggers World ID verification prompt for unauthenticated users
- Paid (view-only) users also get prompted to verify — writing requires Orb
- Already-verified users go straight to the review modal

### 5. Technical approach: Client-Side Blur
- API returns full review data to all users (no auth required on GET reviews)
- Client checks auth state and applies CSS blur
- After verification, flip auth flag → instant unblur
- Acceptable trade-off for hackathon (text in network response but visually gated)

---

## Scope of Changes

### Remove auth gating from
- Next.js middleware (`/home` route — allow unauthenticated access)
- `GET /api/places` — already may work, verify
- `GET /api/places/:id/reviews` — remove 401, return data to everyone

### Keep auth gating on
- `POST /api/reviews` — must be Orb-verified to write
- `POST /api/reviews/:id/vote` — must be authenticated to vote
- `GET /api/user/profile` — still requires auth

### New/Modified Components
- `ReviewCard` — add blur state for review text
- `PlaceDetail` — insert unlock CTA card as first item when not authed
- `AuthGate` — extract verify/pay logic into reusable hook or inline in PlaceDetail
- `home/page.tsx` — remove auth redirect, manage auth state for content gating
- Landing page (`/`) — becomes splash → straight to map (no gate)

### New: USDC Payment Flow
- `MiniKit.commandsAsync.pay()` for $1 USDC
- `POST /api/auth/payment-verify` — verify payment, set cookie with view-only tier
- Database: add `access_tier` field to users (`orb_verified` | `paid_viewer`)

---

## Open Questions

1. **Payment verification**: How does MiniKit payment confirmation work server-side? Need to check World docs.
2. **Access tier persistence**: Should paid access expire? Or permanent after $1?
3. **Voting for paid users**: Currently decided as hidden. Revisit if time permits.

---

## Access Tier Summary

| Action | Anonymous | Paid ($1) | Orb Verified |
|--------|-----------|-----------|--------------|
| Browse map | Yes | Yes | Yes |
| See place info | Yes | Yes | Yes |
| See star ratings | Yes | Yes | Yes |
| Read review text | Blurred | Yes | Yes |
| Write review | Prompt verify | Prompt verify | Yes |
| Vote on reviews | No | No | Yes |
| Profile page | No | Limited | Yes |
