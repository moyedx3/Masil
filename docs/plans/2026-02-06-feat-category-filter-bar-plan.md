---
title: "feat: Add category filter bar on map view"
type: feat
date: 2026-02-06
brainstorm: docs/brainstorms/2026-02-06-category-filter-brainstorm.md
---

# feat: Add Category Filter Bar on Map View

## Overview

Add a compact, icon-only category filter bar overlaid on the map below the header. Users tap a category icon to show only that type's markers; tap again to show all. Only categories with at least 1 place are shown.

## Design Decisions (from brainstorm)

| Decision | Choice |
|----------|--------|
| Filter mode | Toggle single (tap to filter, tap again for all) |
| Category-to-category switch | Direct switch (tap B while A is active → shows B) |
| Visual style | Icon-only compact circular pills |
| Which categories shown | Only those with ≥1 place in data |
| Minimum categories to show bar | 2 (hide bar if only 1 category has data) |
| Implementation | Client-side only, no API changes |
| Active pill treatment | Category-color ring (2px) + light background wash |
| Layout | Centered, horizontal row with `overflow-x-auto` hidden scrollbar |
| "All" button | Implicit (no selection = show all) |
| Bottom sheet interaction | Filter bar covered by sheet backdrop naturally (z-10 < z-40) |
| Filter persistence | Persists until user toggles off; not cleared on sheet close or sign out |
| Map auto-zoom on filter | No — user's viewport is preserved |
| Animation | None — instant marker swap (acceptable for 9-30 markers) |
| Filter bar during loading | Hidden until `status === "ready"` |

## Acceptance Criteria

- [x] Category filter bar renders below the header, overlaid on the map
- [x] Only categories with ≥1 place are shown as pills
- [x] Bar is hidden if fewer than 2 categories have data
- [x] Bar is hidden while places are loading
- [x] Tapping a category shows only that category's markers on the map
- [x] Tapping the active category deselects it and shows all markers
- [x] Tapping a different category directly switches the filter
- [x] Active pill has a visible ring/highlight using the category's color
- [x] Places count badge updates to show filtered count (e.g., "5 Cafes" vs "25 places")
- [x] Each pill has `aria-label` with category name and `aria-pressed` state
- [x] Pill touch targets are at least 44x44px
- [x] Filter state is independent of bottom sheet open/close

## Technical Approach

### State Changes in `home/page.tsx`

```typescript
// New state
const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

// Derived filtered places
const filteredPlaces = useMemo(() => {
  if (!selectedCategory) return places;
  return places.filter(p => p.category === selectedCategory);
}, [places, selectedCategory]);

// Toggle handler
const handleCategorySelect = (category: CategoryKey) => {
  setSelectedCategory(prev => prev === category ? null : category);
};
```

Pass `filteredPlaces` instead of `places` to `<Map>` and to the count badge.

### New Component: `CategoryFilterBar.tsx`

```
app/app/components/CategoryFilterBar.tsx
```

**Props:**

```typescript
interface CategoryFilterBarProps {
  places: Place[];
  selectedCategory: CategoryKey | null;
  onSelectCategory: (category: CategoryKey) => void;
}
```

**Logic:**

1. Compute available categories: iterate `places`, collect unique `category` values
2. If fewer than 2 unique categories, return `null` (don't render)
3. Render a horizontal row of `<button>` elements, one per available category
4. Each button contains a `<CategoryIcon>` at size 28 inside a 44px touch target
5. Active button gets a ring in `CATEGORIES[key].color` + light bg wash

**Styling (follows existing patterns):**

```typescript
// Container
"absolute top-[72px] left-0 right-0 z-10 flex justify-center px-4"

// Inner row
"flex gap-2 bg-[#F7F4EA]/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg"

// Pill button (unselected)
"w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2 border-transparent"

// Pill button (selected) — dynamic border color from CATEGORIES[key].color
"w-11 h-11 rounded-full flex items-center justify-center transition-colors"
+ `border-2` with inline style `borderColor: CATEGORIES[key].color`
+ `backgroundColor: ${CATEGORIES[key].color}20` (hex color + 20% alpha)
```

### Places Count Badge Update

In `home/page.tsx`, update the count badge:

```typescript
// Before:
{places.length} places

// After:
{selectedCategory
  ? `${filteredPlaces.length} ${CATEGORIES[selectedCategory].label}${filteredPlaces.length !== 1 ? 's' : ''}`
  : `${filteredPlaces.length} places`
}
```

### Files Changed

| File | Change |
|------|--------|
| `app/app/components/CategoryFilterBar.tsx` | **New** — filter bar component |
| `app/app/home/page.tsx` | Add state, computed filtered places, render filter bar, update count badge |

### Files NOT Changed

| File | Reason |
|------|--------|
| `app/app/components/Map.tsx` | Already re-renders when `places` prop changes |
| `app/app/components/CategoryIcon.tsx` | Already works at any size |
| `app/lib/db.ts` | `CATEGORIES` already has all needed data |
| `app/app/api/places/route.ts` | Client-side filtering, no API changes |

## Accessibility

- Container: `role="radiogroup"` with `aria-label="Filter by category"`
- Each pill: `<button>` with `aria-label="Filter by {label}"` and `aria-pressed={isActive}`
- Active state uses both ring (shape) and color — not color alone (color-blind safe)
- Touch targets: 44x44px minimum (w-11 h-11 = 44px)
- Focus-visible ring for keyboard navigation: `focus-visible:ring-2 focus-visible:ring-offset-2`

## Edge Cases

| Case | Behavior |
|------|----------|
| Only 1 category has data | Filter bar hidden (no filtering possible) |
| Bottom sheet open + filter changes | Map updates behind sheet; sheet stays open |
| Selected place's category filtered out | Sheet stays open showing the place; map markers change behind it |
| Sign out while filter active | Filter state lost (component unmounts/remounts) |
| Page reload | Filter resets to null (no persistence needed) |
| Places loading | Filter bar hidden until ready |

## References

- Brainstorm: `docs/brainstorms/2026-02-06-category-filter-brainstorm.md`
- CategoryIcon: `app/app/components/CategoryIcon.tsx`
- TagSelector pill patterns: `app/app/components/TagSelector.tsx:69-83`
- CATEGORIES definition: `app/lib/db.ts:72-117`
- Home page layout: `app/app/home/page.tsx:212-328`
- Security learnings: `docs/solutions/security-issues/critical-fixes-xss-rls-user-data.md`
