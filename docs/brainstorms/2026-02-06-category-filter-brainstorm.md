# Category Filter on Map View

**Date:** 2026-02-06
**Status:** Ready for planning

## What We're Building

A compact, icon-only category filter bar overlaid on the map, positioned just below the header. Users can tap a category icon to show only that type's map pins, and tap again to deselect and show all places.

## Why This Approach

- **Icon-only pills** keep the UI minimal and don't obscure the map
- **Toggle single** is the simplest interaction model — no multi-state complexity
- **Client-side filtering** avoids API changes; dataset is small (9-30 places)
- **Dynamic category list** (only categories with data) keeps the bar relevant

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Filter mode | Toggle single | Simplest UX. Tap to filter, tap again for all. |
| Visual style | Icon-only compact pills | Saves space, leverages existing `CategoryIcon` |
| Which categories | Only those with data | Cleaner; no empty categories shown |
| Implementation | Client-side only | Small dataset, no API changes needed |

## Implementation Notes

- Reuses `CategoryIcon` component from `app/components/CategoryIcon.tsx`
- Reuses `CATEGORIES` and `CategoryKey` from `lib/db.ts`
- Filter state lives in `home/page.tsx` (`selectedCategory: CategoryKey | null`)
- Filtered places passed to `<Map>` component
- Positioned below header, z-10, horizontally scrollable if needed
- Active state: slightly larger or with a border/ring highlight
- Pill styling follows existing palette (cream bg, sage accents)

## Open Questions

- Exact positioning (centered vs left-aligned)
- Active pill visual treatment (ring, scale, background change)
- Should "All" be implicit (no selection) or an explicit icon?
