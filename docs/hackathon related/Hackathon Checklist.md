# Masil - World Build Korea 2026 Checklist

**Solo Dev Quick Reference**

---

## Key Dates

| Date | Time | Event |
|------|------|-------|
| **Feb 6 (Fri)** | 19:00 | Day 1 starts, talks begin |
| **Feb 6 (Fri)** | 23:00 | All-night coding (chicken & pizza provided) |
| **Feb 7 (Sat)** | 13:00 | **SUBMISSION DEADLINE** |
| **Feb 7 (Sat)** | 13:30 | Presentations begin (5min each) |
| **Feb 7 (Sat)** | 16:00 | Awards ceremony |

---

## Submission Requirements (Due: Feb 7, 13:00)

- [ ] **Source code ZIP file**
- [ ] **Demo video** - Screen recording on real iOS/Android device
- [ ] **Google Slides** - Must be publicly viewable (check link permissions!)
- [ ] **QR code** - Working mini app access for judges

**Submit here:** https://forms.gle/24sfFCZ1Xa4PZWQQ6

---

## Presentation Format

- **5 min presentation + 2 min Q&A**
- **6 slides max** (structure below)
- Language: Free (English slides recommended)
- **Time over = points deducted**

---

## 6-Slide Structure

### Slide 1: Problem (1 sentence)
> "Foreigners in Korea can't trust online reviews - they're botted, fake, and not tailored for non-Koreans"

### Slide 2: Solution (1 sentence + diagram)
> "Masil: GPS-verified reviews by World ID-verified humans, specifically for foreigners in Jongno-gu"

### Slide 3: Why World ID is ESSENTIAL (not optional)
> - Without World ID: Anyone can create fake accounts, bot reviews
> - With World ID: One human = one account, reviewers are accountable
> - GPS alone isn't enough (can be spoofed), World ID alone isn't enough (not location-verified)
> - **Together = first trustworthy review platform**

### Slide 4: Demo
> - GIF or screen recording of actual app
> - Show: World ID login → GPS check → Post review → View on map

### Slide 5: Privacy & Risk Response
> **What we DON'T collect:**
> - No real names, no personal info
> - Only nullifier_hash (anonymous unique ID)
>
> **Anti-abuse measures:**
> - One person = one account (World ID)
> - Must be physically present (GPS 50m)
> - Trust Score system (community moderation)
> - Future: Economic slashing

### Slide 6: Future Plans (Go-to-Market)
> - Launch in Jongno-gu → Seoul → Korea → Japan/Taiwan
> - Token rewards for helpful reviews
> - Merchant payments integration
> - Target: 500 users in 1 month

---

## Judging Criteria (100 points)

| Criteria | Points | How Masil Addresses It |
|----------|--------|------------------------|
| **Problem & Human-Only Fit** | 30 | Review manipulation is real problem. Without World ID = no trust, service doesn't work |
| **Privacy-by-Design** | 20 | ZKP via World ID, only store nullifier_hash, no personal data |
| **Technical Execution** | 20 | Working demo, GPS + World ID combo prevents abuse |
| **Product Craft & UX** | 15 | Simple flow: Open → Verify → Review → Done |
| **Pitch & Feasibility** | 15 | Clear 5-min story, real use case (Jongno-gu foreigners) |

---

## MVP Feature Checklist

### Must Have (for demo)
- [ ] World ID Orb verification
- [ ] GPS location check (50m radius)
- [ ] Map view with pins (Jongno-gu)
- [ ] Post review with tags
- [ ] View others' reviews
- [ ] Helpful/Not helpful voting
- [ ] Trust score display

### Nice to Have (stretch)
- [ ] $1 USDC paywall for non-verified
- [ ] Search
- [ ] AI tag suggestions

---

## Tech Stack (Quick Reference)

```
Frontend: Next.js 15 + React
Styling: Tailwind + @worldcoin/mini-apps-ui-kit-react
Backend: Next.js API Routes
Database: PostgreSQL (Supabase or Neon)
Maps: Mapbox GL JS
Auth: World ID via MiniKit
```

### Key Commands

```bash
# Create project
npx @worldcoin/create-mini-app@latest masil

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Tunnel for testing (use ngrok)
ngrok http 3000
```

### World ID Integration

```typescript
// Verify user
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'masil-auth',
  verification_level: 'orb'
});

// Check GPS
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
});
```

---

## Development Order (Solo)

1. Project setup + MiniKit
2. Database schema + seed data script
3. Import Google Maps reviews (Jongno-gu spots)
4. World ID auth flow
5. Map view + pins
6. Review CRUD + GPS check
7. Voting + Trust score
8. UI polish
9. Demo video recording
10. Slides preparation

---

## Important Links

- [World Mini Apps Docs](https://docs.world.org/mini-apps)
- [World ID Docs](https://docs.world.org/world-id/concepts)
- [MiniKit SDK](https://www.npmjs.com/package/@worldcoin/minikit-js)
- [Developer Portal](https://developer.worldcoin.org)
- [Submission Form](https://forms.gle/24sfFCZ1Xa4PZWQQ6)

---

## One-Liner Pitch

> "Masil is the first review platform where every review is written by a verified human who was actually there - solving fake reviews for foreigners in Korea using World ID + GPS."

---

## Questions for Judges (Prepare Answers)

1. "Why not just use Google Maps?"
   → No identity verification, reviews can be botted, not foreigner-focused

2. "Can't GPS be spoofed?"
   → Yes, but combined with World ID (one person = one account), mass manipulation becomes impractical

3. "What if someone writes bad reviews intentionally?"
   → Trust Score tracks reputation, future slashing mechanism adds economic penalty

4. "How will you get users?"
   → Seed Jongno-gu with initial reviews, Reddit/Facebook expat groups, on-ground flyering

5. "Why Orb-only, not Device verification?"
   → Higher assurance of uniqueness, prevents multi-accounting even across devices
