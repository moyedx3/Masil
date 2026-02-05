---
title: "feat: Full UI Rebrand with Earthy Color Palette + Logo + Polish"
type: feat
date: 2026-02-06
---

# Full UI Rebrand with Earthy Color Palette, Logo Integration & Polish

## Overview

Transform Masil's visual identity from the current generic white/orange/blue scheme to a distinctive earthy, nature-inspired brand. Integrate the custom "masil." logo (boot-L wordmark), apply the new color palette throughout all 13 components and 3 pages, add favicon, improve micro-animations, and ensure a polished, cohesive look for the hackathon demo.

## Color Palette

From `docs/frotend/color.md`, two complementary earthy palettes:

### Warm Set (accents & backgrounds)
| Hex       | RGB              | Usage                          |
|-----------|------------------|--------------------------------|
| `#A8BBA3` | rgb(168,187,163) | Sage green — success/verified  |
| `#F7F4EA` | rgb(247,244,234) | Warm cream — page backgrounds  |
| `#EBD9D1` | rgb(235,217,209) | Blush pink — card backgrounds  |
| `#B87C4C` | rgb(184,124,76)  | Warm brown — primary accent/CTA|

### Cool Set (UI elements & hierarchy)
| Hex       | RGB              | Usage                          |
|-----------|------------------|--------------------------------|
| `#F1F3E0` | rgb(241,243,224) | Light sage — hover/subtle bg   |
| `#D2DCB6` | rgb(210,220,182) | Soft green — tags/badges       |
| `#A1BC98` | rgb(161,188,152) | Medium green — icons/indicators|
| `#778873` | rgb(119,136,115) | Deep sage — secondary text     |

### Derived System Colors
| Role              | Old Color  | New Color  | Notes                     |
|-------------------|-----------|-----------|---------------------------|
| Background        | `#FFFFFF` | `#F7F4EA` | Warm cream                 |
| Foreground/text   | `#1A1A1A` | `#1A1A1A` | Keep for readability       |
| Primary accent    | `#FF6B35` | `#B87C4C` | Brown — all CTAs, links    |
| Success/verified  | `#22C55E` | `#A8BBA3` | Sage green                 |
| Card background   | `gray-50`  | `#F1F3E0` | Light sage                 |
| Secondary text    | `gray-500` | `#778873` | Deep sage                  |
| Hover/active bg   | `gray-100` | `#EBD9D1` | Blush pink                 |
| Tag selected      | `blue-100` | `#D2DCB6` | Soft green                 |
| Tag text          | `blue-700` | `#778873` | Deep sage                  |
| Warning tag sel   | `orange-100` | `#EBD9D1` | Blush pink               |
| Warning tag text  | `orange-700` | `#B87C4C` | Brown                    |
| Error             | `#EF4444` | `#EF4444` | Keep red for clear errors  |
| World ID gradient | `#3B82F6→#8B5CF6` | Keep | World ID brand identity |

### Trust Score Colors (Rebrand)
| Tier    | Old        | New        |
|---------|------------|------------|
| Trusted | `#22C55E`  | `#A1BC98`  |
| Reliable| `#3B82F6`  | `#A8BBA3`  |
| New     | `#9CA3AF`  | `#D2DCB6`  |
| Low     | `#F97316`  | `#B87C4C`  |
| Bad     | `#EF4444`  | `#EF4444`  |

## Logo Integration

**Asset:** `docs/frotend/logo/no_background.png` — "masil." wordmark in white with boot-shaped L on transparent background.

**Usage plan:**
1. Copy PNG to `app/public/logo.png`
2. Generate favicon from the logo (use a 32x32 crop/derivative)
3. Replace text-only "Masil" / "마실" with the logo image in:
   - **SplashScreen** — centered logo image, tagline below
   - **Landing page (not-installed state)** — logo image replaces text h1
   - **Home page header** — small logo in floating header pill
   - **AuthGate** — logo image above "Welcome to Masil"
4. Since logo is white on transparent, it needs a dark or brown background container OR use the JPEG variant (white on black) OR apply CSS filter for dark contexts

**Logo display strategy:**
- On cream/light backgrounds: Use the JPEG (black bg) or add a dark-brown (`#B87C4C`) rounded container behind the transparent PNG
- On dark backgrounds: Use transparent PNG directly
- Header pill: Small inline logo (~100px wide) with brown bg pill

## Phase 1: Foundation — Config & Assets (10 min)

### 1.1 Copy logo to public
```bash
cp docs/frotend/logo/no_background.png app/public/logo.png
cp "docs/frotnet/logo/Generated Image February 06, 2026 - 5_34AM.jpeg" app/public/logo-dark.jpeg
```

### 1.2 Generate favicon
- Create a simple favicon from the logo (can use the boot-L icon portion)
- Place at `app/public/favicon.ico` and add to `app/app/layout.tsx` metadata

### 1.3 Update `tailwind.config.ts`
```typescript
// app/tailwind.config.ts
colors: {
  brand: {
    cream: "#F7F4EA",     // page bg
    blush: "#EBD9D1",     // card hover/warm bg
    brown: "#B87C4C",     // primary CTA
    sage: "#A8BBA3",      // success/verified
    "sage-light": "#F1F3E0", // card bg
    "sage-soft": "#D2DCB6",  // tags/badges
    "sage-mid": "#A1BC98",   // icons/indicators
    "sage-deep": "#778873",  // secondary text
  },
}
```

### 1.4 Update `globals.css` CSS variables
```css
:root {
  --background: #F7F4EA;
  --foreground: #1A1A1A;
  --accent: #B87C4C;
  --success: #A8BBA3;
  --color-primary-gradient: linear-gradient(135deg, #3B82F6, #8B5CF6); /* keep for World ID */
  --color-trust-high: #A1BC98;
  --color-trust-mid: #A8BBA3;
  --color-trust-new: #D2DCB6;
  --color-trust-low: #B87C4C;
  --color-trust-bad: #EF4444;
}
```

### 1.5 Update `layout.tsx` metadata
- Add favicon link
- Keep title and description

## Phase 2: Core Components Rebrand (30 min)

### 2.1 `SplashScreen.tsx`
**Current:** White bg, text "Masil" in bold, "마실" in gray, orange spinner.
**New:**
- Background: `#F7F4EA` (warm cream)
- Replace text logo with `<img src="/logo.png">` on a `#B87C4C` brown rounded-xl container (since logo is white on transparent)
- "마실" subtitle below in `#778873`
- Tagline "Reviews you can trust" in `#778873`
- Spinner: `border-t-[#B87C4C]` (brown accent)

### 2.2 `AuthGate.tsx`
**Current:** White bg, blue gradient verify button, orange-border pay button.
**Changes:**
- Background: `#F7F4EA`
- Add logo image above "Welcome to Masil"
- Replace "Welcome to Masil" text color to `#1A1A1A` (keep for readability)
- World ID card: bg `#F1F3E0`, border `#D2DCB6`
- Keep World ID gradient button (brand identity)
- Pay button: border `#D2DCB6`, text `#778873`
- FAQ: adapt colors
- Coming Soon toast: bg `#B87C4C`
- Success state: bg `#F1F3E0`, green `#A8BBA3` badge
- Footer text: `#778873`

### 2.3 `HomePage` (`home/page.tsx`)
**Changes:**
- Success toast: bg `#A8BBA3` (sage green)
- Header pill: bg `#F7F4EA`, replace "Masil" text + "마실" with small logo image
- Verified badge: `#A8BBA3` instead of `#22C55E`
- Sign out button: bg `#F7F4EA`, text `#778873`
- Profile button: bg `#F7F4EA`
- Places count pill: bg `#F7F4EA`, text `#778873`
- Error state bg: `#F7F4EA`
- Retry button: bg `#B87C4C`

### 2.4 `BottomSheet.tsx`
**Changes:**
- Sheet bg: `#F7F4EA` (cream) instead of white
- Drag handle: `#D2DCB6` (soft green) instead of gray-300
- Shadow: keep as-is (dark shadow works on cream)

### 2.5 `PlaceDetail.tsx`
**Changes:**
- Category text: `#778873`
- Address bg: `#F1F3E0`, icon color: `#A1BC98`
- Get Directions button: bg `#B87C4C` (brown) instead of `#1A1A1A`
- Reviews section border: `#D2DCB6`
- Empty state text: `#778873`
- Add Review CTA: bg `#B87C4C` instead of `#FF6B35`
- GPS note text: `#778873`
- "Add Review" sticky footer bg: `#F7F4EA`

### 2.6 `ReviewCard.tsx`
**Changes:**
- Card bg: `#F1F3E0` instead of gray-50
- Imported badge bg: `#EBD9D1`
- "Read more" link: `#B87C4C` instead of `#FF6B35`
- Tag chips: bg `#D2DCB6`, text `#778873`
- Vote button border: `#D2DCB6`

### 2.7 `VoteButtons.tsx`
**Changes:**
- Helpful active: `#A1BC98` instead of `#22C55E`
- Border: `#D2DCB6` instead of gray-200
- Inactive text: `#778873`

### 2.8 `TrustBadge.tsx`
**Changes:**
- Trust tier colors updated via `lib/db.ts` TRUST_TIERS constant
- No component code changes needed if colors come from tier.color

### 2.9 `AddReviewModal.tsx`
**Changes:**
- Modal bg: `#F7F4EA`
- Header bg: `#F7F4EA`, border: `#D2DCB6`
- Close button hover: `#EBD9D1`
- Category text: `#778873`
- Textarea focus ring: `#A1BC98`
- Submit button: bg `#B87C4C` instead of `#FF6B35`, hover darker brown
- Disabled button: bg `#D2DCB6`, text `#778873`

### 2.10 `GPSStatus.tsx`
**Changes:**
- Checking: bg `#F1F3E0`, border `#D2DCB6`, spinner `#A1BC98`
- Verified: bg `#F1F3E0`, border `#D2DCB6`, badge `#A8BBA3`
- Too far: Keep red (error must be visible)
- Denied: bg `#EBD9D1`, border `#B87C4C` (warm warning)
- Error: bg `#F1F3E0`

### 2.11 `TagSelector.tsx`
**Changes:**
- Selected positive: bg `#D2DCB6`, text `#778873`, border `#A1BC98`
- Selected warning: bg `#EBD9D1`, text `#B87C4C`, border `#B87C4C`
- Unselected: bg `#F7F4EA`, text `#778873`, border `#D2DCB6`

### 2.12 `StarRating.tsx`
**Changes:**
- Active star: `#B87C4C` (brown) instead of yellow-400
- Inactive star: `#D2DCB6` instead of gray-300

### 2.13 `FAQ.tsx`
**Changes:**
- Adapt border and text colors to earthy palette

## Phase 3: Profile Page Rebrand (10 min)

### 3.1 `profile/page.tsx`
**Changes:**
- Background: `#F7F4EA`
- Header border: `#D2DCB6`
- Back button: `#778873`
- Avatar bg: Use trust tier color with updated palette
- Stats cards bg: `#F1F3E0`
- Trust explanation card bg: `#F1F3E0`
- Review cards bg: `#F1F3E0`
- "Go explore" link: `#B87C4C`
- Stars: `#B87C4C` active, `#D2DCB6` inactive

## Phase 4: Landing Page Rebrand (5 min)

### 4.1 `page.tsx` (landing)
**Changes:**
- Checking-auth spinner: `border-t-[#B87C4C]`
- Not-installed state:
  - bg: `#F7F4EA`
  - Replace text logo with logo image on brown container
  - QR code shadow card: keep white for contrast
  - Instructions card: bg `#F1F3E0`

## Phase 5: Data Layer — Trust Tier Colors (5 min)

### 5.1 `lib/db.ts` — Update TRUST_TIERS
```typescript
export const TRUST_TIERS = {
  trusted: { min: 80, label: "Trusted", color: "#A1BC98" },
  reliable: { min: 60, label: "Reliable", color: "#A8BBA3" },
  new: { min: 40, label: "New", color: "#D2DCB6" },
  low: { min: 20, label: "Low", color: "#B87C4C" },
  bad: { min: 0, label: "Untrusted", color: "#EF4444" },
};
```

## Phase 6: Favicon & Meta (5 min)

### 6.1 Favicon
- Create a simple 32x32 favicon. Options:
  - Use the boot-L portion of the logo as an icon
  - Or create a simple brown circle with "m" initial
- Place at `app/public/favicon.ico`

### 6.2 Layout metadata
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: "Masil - Verified Neighborhood Reviews",
  description: "GPS-verified, World ID-authenticated reviews for foreigners in Korea",
  icons: {
    icon: "/favicon.ico",
  },
};
```

## Phase 7: Micro-animations & Polish (10 min)

### 7.1 Add subtle animations to `globals.css`
- **Scale-in** for bottom sheet content appearing
- **Pulse** for GPS checking state
- **Smooth color transitions** on hover states
- Add `transition-colors duration-200` to interactive elements missing it

### 7.2 Add profile navigation link
- Currently the profile button on home page works but lacks visual feedback
- Add active/pressed state styling

### 7.3 Responsive tweaks
- Ensure bottom sheet works well on smaller screens (320px width)
- Verify modal doesn't overflow on small devices
- Add `safe-area-inset-bottom` padding for iOS notch devices

## Acceptance Criteria

- [x] All pages use `#F7F4EA` cream background instead of white
- [x] All CTAs use `#B87C4C` brown accent instead of `#FF6B35` orange
- [x] Logo image appears in splash screen, auth gate, and home header
- [x] Favicon is present and loads correctly
- [x] Trust score colors use the new earthy palette
- [x] Tags, badges, and cards use sage/blush palette
- [x] Star ratings use brown instead of yellow
- [x] World ID button keeps its blue→purple gradient (brand identity)
- [x] Error states keep red for visibility
- [x] No hardcoded old colors remain in component files
- [x] All pages build without errors
- [x] Visual coherence across splash → auth → home → detail → review → profile flow
- [x] GPS status indicators are visually clear with new colors
- [x] Profile page fully rebranded

## Files to Modify

| File | Changes |
|------|---------|
| `app/public/logo.png` | NEW — copy from docs |
| `app/public/logo-dark.jpeg` | NEW — copy from docs |
| `app/public/favicon.ico` | NEW — generate from logo |
| `tailwind.config.ts` | Add brand color tokens |
| `app/globals.css` | Update CSS variables, add animations |
| `app/layout.tsx` | Add favicon metadata |
| `app/page.tsx` | Rebrand landing page |
| `app/home/page.tsx` | Rebrand home page |
| `app/profile/page.tsx` | Rebrand profile page |
| `app/components/SplashScreen.tsx` | Logo image + colors |
| `app/components/AuthGate.tsx` | Logo image + colors |
| `app/components/BottomSheet.tsx` | Cream bg + sage handle |
| `app/components/PlaceDetail.tsx` | Brown CTAs + sage accents |
| `app/components/ReviewCard.tsx` | Sage cards + brown links |
| `app/components/AddReviewModal.tsx` | Cream bg + brown submit |
| `app/components/VoteButtons.tsx` | Sage green active |
| `app/components/TrustBadge.tsx` | No changes (driven by db.ts) |
| `app/components/GPSStatus.tsx` | Earthy status colors |
| `app/components/TagSelector.tsx` | Sage/blush tag chips |
| `app/components/StarRating.tsx` | Brown stars |
| `app/components/FAQ.tsx` | Earthy text colors |
| `lib/db.ts` | Update TRUST_TIERS colors |

## Estimated Effort

- Phase 1 (Foundation): 10 min
- Phase 2 (Core Components): 30 min
- Phase 3 (Profile): 10 min
- Phase 4 (Landing): 5 min
- Phase 5 (Data Layer): 5 min
- Phase 6 (Favicon/Meta): 5 min
- Phase 7 (Polish): 10 min
- **Total: ~75 min**

## Risk Notes

- Logo is white on transparent — needs dark container on light backgrounds
- Color contrast: Ensure `#778873` text on `#F7F4EA` bg passes WCAG AA (ratio ~3.8:1 — borderline, may need to darken text slightly for small text)
- World ID gradient button should NOT change (brand requirement)
- Keep red for errors (color must mean danger universally)
