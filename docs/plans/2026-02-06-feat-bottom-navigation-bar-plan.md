---
title: "feat: Add Bottom Navigation Bar"
type: feat
date: 2026-02-06
brainstorm: docs/brainstorms/2026-02-06-bottom-nav-bar-brainstorm.md
---

# feat: Add Bottom Navigation Bar

## Overview

Add a persistent bottom navigation bar with 3 tabs (Map, Profile, About) using a Next.js route group layout. The nav hides when the bottom sheet is fully expanded and is visible to all auth tiers.

## Problem Statement

- Profile button is a small emoji in the header overlay — easy to miss
- No About/FAQ section is discoverable
- Bottom nav is standard mobile UX that users expect in a mini app

## Proposed Solution

Create a `(main)` route group containing `/home`, `/profile`, `/about` with a shared layout that renders a `<BottomNav />` component. The splash page `/` stays outside the group (no nav).

### Route Structure

```
app/
├── page.tsx                    # "/" splash — NO nav
├── layout.tsx                  # Root layout (MiniKitProvider)
├── (main)/
│   ├── layout.tsx              # Shared layout — renders <BottomNav />
│   ├── home/
│   │   └── page.tsx            # Map view (moved from app/home/)
│   ├── profile/
│   │   └── page.tsx            # Profile (moved from app/profile/)
│   └── about/
│       └── page.tsx            # NEW — app info + FAQ
├── components/
│   ├── BottomNav.tsx           # NEW — bottom navigation component
│   └── ... (existing)
└── api/                        # Unchanged
```

**Key:** Next.js route groups `(main)` don't affect the URL — routes stay `/home`, `/profile`, `/about`.

## Technical Approach

### Phase 1: Route Group + BottomNav Component

#### 1a. Create `(main)` route group layout

**File:** `app/(main)/layout.tsx`

```tsx
"use client";
import { useState } from "react";
import BottomNav from "@/app/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [hideNav, setHideNav] = useState(false);

  return (
    <>
      {children}
      <BottomNav hidden={hideNav} />
    </>
  );
}
```

**Decision:** The `hideNav` state lives here and is passed down to the home page via React Context or prop drilling through children. Since `children` can't receive props directly, we use a simple Context.

#### 1b. Create NavContext for sheet-to-nav communication

**File:** `app/components/NavContext.tsx`

```tsx
"use client";
import { createContext, useContext, useState } from "react";

const NavContext = createContext<{
  hideNav: boolean;
  setHideNav: (v: boolean) => void;
}>({ hideNav: false, setHideNav: () => {} });

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [hideNav, setHideNav] = useState(false);
  return (
    <NavContext.Provider value={{ hideNav, setHideNav }}>
      {children}
    </NavContext.Provider>
  );
}

export const useNav = () => useContext(NavContext);
```

**Usage in `(main)/layout.tsx`:** Wrap children with `<NavProvider>`, BottomNav reads `hideNav` from context.

**Usage in home page:** Call `setHideNav(true)` when bottom sheet reaches full snap.

#### 1c. Create BottomNav component

**File:** `app/components/BottomNav.tsx`

```tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useNav } from "./NavContext";

// 3 tabs with inline SVG icons
const tabs = [
  { href: "/home", label: "Map", icon: <MapIcon /> },
  { href: "/profile", label: "Profile", icon: <PersonIcon /> },
  { href: "/about", label: "About", icon: <InfoIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { hideNav } = useNav();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-[#F7F4EA] border-t border-[#D2DCB6]
        transition-transform duration-200 ease-out
        ${hideNav ? "translate-y-full" : "translate-y-0"}
        pb-[env(safe-area-inset-bottom)]`}
    >
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={pathname === tab.href ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-2
              ${pathname === tab.href ? "text-[#B87C4C]" : "text-[#778873]"}`}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**Styling decisions:**
- `z-30` — above map overlays (z-10), below sheet backdrop (z-40)
- `h-14` (56px) — standard mobile nav height
- `pb-[env(safe-area-inset-bottom)]` — respects iOS/Android gesture bars
- `transition-transform duration-200` — smooth slide-down when hiding
- Icons: inline SVG, 24x24, following CategoryIcon pattern
- Active: `#B87C4C` (earthy brown), Inactive: `#778873` (sage deep)

### Phase 2: Move Existing Routes

#### 2a. Move `/home` to `/(main)/home`

- Move `app/home/page.tsx` → `app/(main)/home/page.tsx`
- URL stays `/home` (route groups don't affect paths)
- Update: remove profile button from header overlay (nav handles it now)
- Update: remove sign-out button from header (move to profile page)
- Add `pb-14` (or `pb-20` with safe area) to map container so pins aren't hidden by nav

#### 2b. Move `/profile` to `/(main)/profile`

- Move `app/profile/page.tsx` → `app/(main)/profile/page.tsx`
- Remove back arrow header — bottom nav handles navigation now
- Change 401 redirect from `"/"` to `"/home"` (don't send users back to splash)
- For anonymous users: show "Verify with World ID to see your profile" card with verify CTA

#### 2c. Update splash page redirect

- `app/page.tsx` stays at root (outside route group, no nav)
- No changes needed — it already redirects to `/home`

### Phase 3: Create About Page

**File:** `app/(main)/about/page.tsx`

Content sections:
1. **Hero** — Masil logo + tagline "Your neighborhood guide in Korea"
2. **How It Works** — 3-step visual: Browse Map → Read Reviews → Share Your Experience
3. **Trust Score** — Brief explanation of the 0-100 scoring system
4. **FAQ** — Reuse existing `<FAQ />` component
5. **Footer** — "Built for World Build Korea 2026" + version

### Phase 4: Bottom Sheet ↔ Nav Communication

#### Modify BottomSheet to report snap state

**File:** `app/components/BottomSheet.tsx`

Add `onSnapChange?: (snapPoint: string) => void` prop:

```tsx
// When snapping to a point, report it
const snapTo = (point: keyof typeof SNAP_POINTS) => {
  setHeight(SNAP_POINTS[point]);
  onSnapChange?.(point);
};
```

**In home page:** When `onSnapChange` reports `"full"`, call `setHideNav(true)`. When it reports anything else, call `setHideNav(false)`.

### Phase 5: Cleanup & Polish

- Remove profile emoji button from home page header
- Remove sign-out from home page header (move to profile page)
- Simplify home page header to just logo + verification badge
- Add bottom padding to all page content to clear the nav bar
- Test z-index stacking: nav (z-30) < sheet backdrop (z-40) < sheet (z-50) < modals (z-60+)

## Acceptance Criteria

- [x] Bottom nav with 3 tabs (Map, Profile, About) visible on `/home`, `/profile`, `/about`
- [x] Active tab highlighted in `#B87C4C`, inactive in `#778873`
- [x] Nav hidden on splash page `/`
- [x] Nav slides down when bottom sheet reaches full (90vh)
- [x] Nav slides back up when sheet drops below full
- [x] All auth tiers see all 3 tabs
- [x] Anonymous users see "verify to unlock" on Profile page
- [x] About page shows app info + FAQ
- [x] Profile page no longer has back arrow (nav replaces it)
- [x] Map pins not obscured by nav (bottom padding added)
- [x] Safe area insets respected on iOS/Android
- [x] Proper ARIA attributes (`role="navigation"`, `aria-current="page"`)

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sheet state communication | React Context (`NavContext`) | Lightweight, no new deps, only used by 2 components |
| Route structure | `(main)` route group | Clean shared layout, URL paths unchanged |
| Sheet behavior on tab switch | Closes (resets) | Simplest implementation, no global state needed |
| Map state on return | Resets to default | Acceptable for MVP, no time for state persistence |
| Nav hide animation | `translateY(100%)` 200ms | Smooth, performant (GPU-accelerated transform) |
| Auth 401 redirect | Changed to `/home` | Don't send users back to splash |
| Icons | Inline SVG | Consistent with CategoryIcon pattern, no extra deps |

## Implementation Order

```
1. Create NavContext                    (~5 min)
2. Create BottomNav component           (~20 min)
3. Create (main) route group layout     (~10 min)
4. Move /home into (main)/home          (~10 min)
5. Move /profile into (main)/profile    (~10 min)
6. Create /about page                   (~20 min)
7. Modify BottomSheet onSnapChange      (~15 min)
8. Wire up sheet → nav hiding           (~10 min)
9. Cleanup header (remove profile btn)  (~10 min)
10. Add bottom padding to pages         (~5 min)
11. Test all flows                      (~15 min)
```

**Estimated total: ~2 hours**

## References

- Brainstorm: `docs/brainstorms/2026-02-06-bottom-nav-bar-brainstorm.md`
- Current home page: `app/home/page.tsx`
- Current profile page: `app/profile/page.tsx`
- Bottom sheet: `app/components/BottomSheet.tsx`
- FAQ component: `app/components/FAQ.tsx`
- Color palette: `app/globals.css`, `tailwind.config.ts`
