# Bottom Navigation Bar

**Date:** 2026-02-06
**Status:** Ready for planning

## What We're Building

A persistent bottom navigation bar with 3 tabs: **Map**, **Profile**, and **About**. It provides clear, conventional mobile navigation and makes all sections discoverable.

## Why This Approach

- **Discoverability**: Profile button is currently a small emoji in the header overlay — easy to miss
- **Convention**: Bottom nav is expected UX for mobile mini apps
- **New content**: About page (app info + FAQ) needs a home

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tabs | Map, Profile, About | Keep it simple — 3 core sections |
| Architecture | Shared route group layout | No duplication, smooth transitions |
| Visibility | Hide when bottom sheet is fully expanded | Avoid visual clutter on place detail |
| Auth gating | Show all 3 tabs to everyone | Profile shows "verify to unlock" for anonymous users |
| About content | App info + FAQ | What is Masil, how it works, trust score explanation, existing FAQ component |
| Styling | Earthy palette — `#B87C4C` active, `#778873` inactive | Matches existing design system |

## Implementation Notes

- Create a Next.js route group `(main)` containing `/home`, `/profile`, `/about`
- Shared layout in `(main)/layout.tsx` renders `<BottomNav />`
- `BottomNav` component reads current pathname via `usePathname()`
- Bottom sheet communicates snap state up so layout can hide/show nav
- Move existing `/home` and `/profile` routes into the route group
- Create new `/about` page with app info + existing `<FAQ />` component

## Open Questions

- Icon style: outlined vs filled? (Can decide during implementation)
- Transition animation: slide or instant switch?
