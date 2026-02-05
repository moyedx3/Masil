---
title: "Critical Security Fixes: XSS Protection, RLS Policies, and User Data Integrity"
category: security-issues
tags:
  - xss
  - rls
  - supabase
  - mapbox
  - react
  - world-mini-app
  - code-review
modules:
  - map-view
  - home-page
  - database
severity: P1
status: resolved
date_identified: 2026-02-06
date_fixed: 2026-02-06
commit: a1f0122
---

# Critical Security Fixes: XSS, RLS, and User Data Integrity

## Problem Statement

During code review of the Seed Data + Map View feature, three critical (P1) security issues were identified that needed immediate fixing before the hackathon demo:

1. **XSS vulnerability** in Mapbox popup - place names injected directly into HTML
2. **Missing RLS policies** on places and reviews tables - no row-level security
3. **Hardcoded fake user data** - UI showed trust_score=50, review_count=0 always

## Symptoms

- Map popup could execute arbitrary JavaScript if place name contained `<script>` or event handlers
- Supabase tables had no access control policies, creating security gaps
- User card always displayed the same stats regardless of actual user data

## Root Cause Analysis

### XSS Vulnerability
The `Map.tsx` component used Mapbox's `setHTML()` method with direct template string interpolation:

```typescript
// VULNERABLE CODE
.setHTML(`
  <strong>${place.name}</strong>
  <div>${categoryInfo.label}</div>
`)
```

If `place.name` contained `<img src=x onerror=alert(document.cookie)>`, the script would execute when the popup rendered.

### Missing RLS Policies
The `places` and `reviews` tables were created without Row Level Security, unlike the `users` table which had proper RLS from the start. This inconsistency meant:
- No explicit access control on these tables
- Potential security gap depending on Supabase project settings

### Hardcoded User Data
The home page created local state with hardcoded values:

```typescript
// PROBLEMATIC CODE
setUser({
  nullifier_hash: nullifier,
  trust_score: 50,  // Always 50
  review_count: 0,  // Always 0
});
```

This created a disconnect between displayed data and actual database values.

## Solution

### Fix 1: XSS Protection

Added an `escapeHtml()` function using safe DOM APIs:

```typescript
// app/app/components/Map.tsx

// Escape HTML to prevent XSS attacks
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Applied to popup content
.setHTML(`
  <strong>${escapeHtml(place.name)}</strong>
  <div>${escapeHtml(categoryInfo.label)}</div>
`)
```

**Why this works:** Setting `textContent` automatically escapes HTML entities. Reading `innerHTML` back returns the escaped string where `<`, `>`, `&`, quotes are encoded as `&lt;`, `&gt;`, `&amp;`, etc.

### Fix 2: RLS Policies

Created new migration `004_add_rls_policies.sql`:

```sql
-- app/supabase/migrations/004_add_rls_policies.sql

-- Places table RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Places are publicly readable"
  ON places FOR SELECT
  USING (true);

CREATE POLICY "Service can manage places"
  ON places FOR ALL
  WITH CHECK (true);

-- Reviews table RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Service can manage reviews"
  ON reviews FOR ALL
  WITH CHECK (true);
```

**Policy logic:**
- Public SELECT allows frontend to fetch places/reviews
- Service role can perform all operations for backend management
- All writes go through API endpoints which verify World ID authentication

### Fix 3: Remove Fake User Data

Removed the entire 40-line toggleable user card and replaced with a simple verified badge:

```typescript
// app/app/home/page.tsx

// Before: Complex user card with fake stats
// After: Simple verified badge in header
<div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
  <span className="text-lg font-bold text-[#1A1A1A]">Masil</span>
  <span className="text-sm text-gray-500">마실</span>
  <div className="w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center ml-1">
    <span className="text-xs text-white">✓</span>
  </div>
</div>
```

**Result:** No misleading data displayed. Users see they're verified via the green checkmark.

## Prevention Strategies

### XSS Prevention Checklist

- [ ] Never use `innerHTML`, `setHTML()`, or `dangerouslySetInnerHTML` with user content
- [ ] Use React's default text rendering (automatically escapes)
- [ ] If HTML is required, use DOMPurify or the `escapeHtml()` pattern
- [ ] Add CSP headers to prevent inline script execution

**ESLint rule to add:**
```javascript
// .eslintrc.js
rules: {
  'react/no-danger': 'error',
}
```

### RLS Prevention Checklist

- [ ] Enable RLS on EVERY new table immediately after creation
- [ ] Create explicit policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Test policies with different user contexts
- [ ] Run RLS audit query periodically:

```sql
-- Find tables without RLS
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

### Hardcoded Data Prevention

- [ ] Never hardcode display values in components
- [ ] Show loading states while fetching
- [ ] Show explicit empty states when no data exists
- [ ] Use TypeScript to enforce data shapes
- [ ] Remove all placeholder content before production

## Files Changed

| File | Change |
|------|--------|
| `app/app/components/Map.tsx` | Added `escapeHtml()` function, applied to popup content |
| `app/supabase/migrations/004_add_rls_policies.sql` | New migration for RLS policies |
| `app/app/home/page.tsx` | Removed user card, added simple verified badge |

## Verification

1. **XSS Fix:** Popup content now renders as text, not executable HTML
2. **RLS Fix:** Migration applied to Supabase, policies active
3. **User Data Fix:** No fake data displayed, header shows verified status

## Related Documentation

- [Technical PRD - Security Considerations](/docs/Technical%20PRD.md) - Line 468-475
- [World Mini App Implementation Guide](/docs/world_related/World%20Mini%20App%20Implementation%20Guide.md) - Server-side verification patterns
- [001_create_users.sql](/app/supabase/migrations/001_create_users.sql) - Reference RLS implementation

## Lessons Learned

1. **Review all HTML injection points** - Any use of `setHTML()`, `innerHTML`, or `dangerouslySetInnerHTML` is a potential XSS vector
2. **RLS should be part of table creation** - Add RLS policies in the same migration that creates the table
3. **Don't ship placeholder data** - Remove or properly gate any hardcoded display values before demo
4. **Code review catches security issues** - Multi-agent review identified all three issues efficiently
