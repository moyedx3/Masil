---
title: "feat: Replace emoji markers with custom SVG circle markers"
type: feat
date: 2026-02-06
---

# feat: Replace Emoji Markers with Custom SVG Circle Markers

## Overview

Replace the current emoji-based map markers with custom 36x36 SVG circle markers. Each place category gets a unique earthy color with a white Phosphor line-icon centered inside. Update all category display surfaces (Map, PlaceDetail, AddReviewModal) for full visual consistency.

## Problem Statement / Motivation

The current emoji markers render inconsistently across platforms (World App WebView, browsers) and lack visual cohesion with the app's earthy design system. Custom SVG markers give precise control over color, size, and style, creating a more polished, branded map experience.

## Proposed Solution

### Marker Structure

Each marker is a **36x36px inline SVG** circle:

```
┌──────────────┐
│   ╭──────╮   │
│   │  ☕   │   │  36×36 SVG
│   │(white)│   │  Circle fill: category color
│   ╰──────╯   │  Stroke: white, 2.5px
└──────────────┘  Icon: ~18px white Phosphor line-icon
     ↓
 drop-shadow(0 2px 4px rgba(0,0,0,0.25))
```

### Category → Color → Icon Mapping

Colors are derived from the `docs/frotend/color.md` palette, chosen so adjacent categories on the map are visually distinct. Each category gets a slightly different shade:

| Category     | Color     | Icon File             | Visual Association        |
|-------------|-----------|----------------------|---------------------------|
| cafe        | `#B87C4C` | `coffee.svg`         | Warm brown = coffee       |
| restaurant  | `#778873` | `fork-knife.svg`     | Dark sage = dining        |
| atm         | `#A8BBA3` | `currency-krw.svg`   | Muted green = money       |
| hospital    | `#D2735E` | `hospital.svg`       | Muted red-earth = medical |
| pharmacy    | `#A1BC98` | `pill.svg`           | Soft green = health       |
| service     | `#8B7355` | `wrench.svg` (new)   | Warm taupe = utility      |
| other       | `#D2DCB6` | `map-pin.svg` (new)  | Pale sage = neutral       |

**Color rationale:**
- `hospital` uses `#D2735E` (a warm terra-cotta/red-earth not in the palette but complementary) to stand out as urgent/medical, distinct from the greens.
- `cafe` and `service` use warm browns/taupes, but `#B87C4C` (bright copper) vs `#8B7355` (muted taupe) are easily distinguishable.
- `restaurant` uses the darkest green (`#778873`) to contrast with the lighter greens used by atm/pharmacy/other.
- `atm` and `pharmacy` both use greens but `#A8BBA3` (gray-green) vs `#A1BC98` (brighter sage) differ enough, and their icons (₩ symbol vs pill) provide secondary differentiation.

### Files Changed

| File | Change |
|---|---|
| `app/lib/db.ts` | Extend `CATEGORIES` with `icon` (SVG path data) and `color` fields |
| `app/app/components/Map.tsx` | Replace emoji div with inline SVG marker element |
| `app/app/components/PlaceDetail.tsx` | Replace emoji text with small inline SVG circle icon |
| `app/app/components/AddReviewModal.tsx` | Replace emoji text with small inline SVG circle icon |
| `app/public/icons/wrench.svg` | **New** - Phosphor wrench icon for "service" |
| `app/public/icons/map-pin.svg` | **New** - Phosphor map-pin icon for "other" |
| `app/app/components/CategoryIcon.tsx` | **New** - Shared component for rendering category circle icons at any size |

## Technical Approach

### 1. Source Missing Icons

Download `wrench.svg` and `map-pin.svg` from [Phosphor Icons](https://phosphoricons.com/) (same library as the existing icons, based on path data analysis). Use the "regular" weight to match existing icons.

### 2. Extract SVG Path Data into CATEGORIES

Rather than loading SVG files at runtime (which prevents fill color control via `<img>`), extract the `<path d="...">` data from each SVG file and store it directly in the `CATEGORIES` constant. This enables:
- Inline SVG rendering with `fill="white"` override
- Zero network requests for icons
- Single source of truth in `db.ts`

```typescript
// app/lib/db.ts
export const CATEGORIES = {
  cafe: {
    emoji: "☕",
    label: "Cafe",
    color: "#B87C4C",
    // SVG path data extracted from coffee.svg (viewBox 0 0 256 256)
    iconPath: "M80,56V24a8,8,0,0,1,16,0V56a8,8,0...",
  },
  restaurant: {
    emoji: "🍽️",
    label: "Restaurant",
    color: "#778873",
    iconPath: "M72,88V40a8,8,0,0,1,16,0V88a8,8,0...",
  },
  // ... etc for all 7 categories
} as const;
```

### 3. Create Shared CategoryIcon Component

A reusable React component that renders the colored circle + white icon at any size. Used by Map.tsx (via DOM string), PlaceDetail.tsx, and AddReviewModal.tsx.

```typescript
// app/app/components/CategoryIcon.tsx
interface CategoryIconProps {
  category: CategoryKey;
  size?: number; // default 36 for map, 24 for inline
}

export default function CategoryIcon({ category, size = 36 }: CategoryIconProps) {
  const info = CATEGORIES[category] || CATEGORIES.other;
  const strokeWidth = size > 30 ? 2.5 : 2;
  const iconScale = size / 36; // scale icon relative to 36px base

  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16.25" fill={info.color} stroke="white" strokeWidth={strokeWidth} />
      <g transform={`translate(9, 9) scale(${18/256})`}>
        <path d={info.iconPath} fill="white" />
      </g>
    </svg>
  );
}
```

### 4. Update Map.tsx Marker Creation

Replace the emoji div with an inline SVG string set via `innerHTML`. This is necessary because Mapbox `mapboxgl.Marker` takes a raw DOM element, not a React component.

```typescript
// app/app/components/Map.tsx (marker creation section)
const el = document.createElement("div");
el.className = "category-marker";
el.setAttribute("aria-label", `${place.name} - ${categoryInfo.label}`);
el.style.cssText = `
  width: 36px;
  height: 36px;
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
`;

el.innerHTML = `
  <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16.25" fill="${categoryInfo.color}" stroke="white" stroke-width="2.5"/>
    <g transform="translate(9,9) scale(${18/256})">
      <path d="${categoryInfo.iconPath}" fill="white"/>
    </g>
  </svg>
`;
```

**Note:** `categoryInfo.color` and `categoryInfo.iconPath` are from the `CATEGORIES` constant (hardcoded strings, not user input), so there is no XSS risk from `innerHTML` here. The documented XSS concern in `docs/solutions/` applies to place names in `setHTML()` popups, not to category constants.

### 5. Update PlaceDetail.tsx and AddReviewModal.tsx

Replace `{categoryInfo.emoji}` text with `<CategoryIcon category={category} size={24} />` inline in the header sections.

**PlaceDetail.tsx** (~line 78): Replace emoji span with `<CategoryIcon>` component.

**AddReviewModal.tsx** (~line 182): Replace emoji span with `<CategoryIcon>` component.

## Acceptance Criteria

- [x] All 7 categories render as colored SVG circle markers on the map
- [x] Each category has a visually distinct color from the earthy palette
- [x] White Phosphor line-icons are centered and recognizable inside each circle
- [x] Circle has white 2.5px stroke/border
- [x] Subtle drop shadow applied to each marker
- [x] Markers are 36x36px with `anchor: "center"` (no position shift from current behavior)
- [x] Click handler on markers still triggers `onPlaceSelect` correctly
- [x] PlaceDetail bottom sheet header shows small (24px) colored circle icon instead of emoji
- [x] AddReviewModal header shows small (24px) colored circle icon instead of emoji
- [x] `wrench.svg` and `map-pin.svg` added to `app/public/icons/` (Phosphor regular weight)
- [x] `CATEGORIES` object in `db.ts` extended with `color` and `iconPath` fields
- [x] `CategoryIcon` shared component created and used across all three surfaces
- [x] Markers have `aria-label` with place name and category for accessibility
- [x] No visual regression on marker click → bottom sheet flow
- [x] No XSS vectors introduced (all `innerHTML` uses hardcoded constants only)

## Dependencies & Risks

**Dependencies:**
- Phosphor Icons availability for `wrench` and `map-pin` (both are standard icons in the library)
- SVG path data extraction from existing icon files (already read, paths are known)

**Risks:**
- **Low:** Icon scaling at 18px inside 36px circle may lose fine detail for complex icons like `fork-knife.svg`. Mitigation: test visually, adjust scale factor if needed.
- **Low:** Four green-family colors in the palette. Mitigation: assigned greens to categories least likely to co-locate (atm vs pharmacy), and used non-green colors for common categories (cafe = brown, hospital = terra-cotta).
- **None:** This is a purely visual change with no data model, API, or auth impact.

## Out of Scope (Deferred)

- Selected marker state (scale-up, border color change on tap) — separate enhancement
- Marker clustering for high-density areas — not needed for 20-30 seed places
- Hover effects — primary platform is mobile (World App WebView)
- Animated transitions between emoji and SVG markers

## References & Research

### Internal References

- Current marker implementation: `app/app/components/Map.tsx:70-100`
- Categories definition: `app/lib/db.ts:72-80`
- Category usage in PlaceDetail: `app/app/components/PlaceDetail.tsx:30-31`
- Category usage in AddReviewModal: `app/app/components/AddReviewModal.tsx:4,182`
- Color palette: `docs/frotnet/color.md`
- XSS security learning: `docs/solutions/security-issues/critical-fixes-xss-rls-user-data.md`

### External References

- Phosphor Icons: https://phosphoricons.com/
- Mapbox GL JS custom markers: https://docs.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
