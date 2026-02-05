---
title: "World Mini App QR Code Not Working in World App"
category: "integration-issues"
tags:
  - world-id
  - minikit-js
  - qr-code
  - world-app
  - developer-portal
  - railway
module: "@worldcoin/minikit-js"
symptoms:
  - "QR code scans but app doesn't open in World App"
  - "World App says QR not supported"
  - "MiniKit.isInstalled() returns false in World App"
  - "App works in browser but not in World App"
date_solved: 2026-02-06
---

# World Mini App QR Code Not Working in World App

## Problem

When building a World Mini App, the QR code generated for testing doesn't work when scanned with World App. The app either:
- Shows "QR not supported" error
- Fails to open in World App
- Opens but MiniKit doesn't initialize properly

## Root Cause

Three interconnected issues caused the QR code scanning to fail:

### 1. MiniKit.install() missing app_id parameter

The MiniKit SDK must be initialized with your application ID to establish communication with World App.

**Before (broken):**
```typescript
MiniKit.install();  // No app_id!
```

**After (working):**
```typescript
MiniKit.install("app_e46be27bec413add7207c6d40b28d906");
```

### 2. Wrong QR Code URL format

The QR code URL must use the exact format from Developer Portal, including:
- `world.org` (not `worldcoin.org`)
- `draft_id` parameter for unpublished/draft apps

**Before (broken):**
```
https://worldcoin.org/mini-app?app_id=app_xxx
```

**After (working):**
```
https://world.org/mini-app?app_id=app_xxx&draft_id=meta_xxx
```

### 3. Developer Portal URL mismatch

The App URL registered in Developer Portal must exactly match your deployment URL.

## Solution

### Step 1: Fix MiniKit initialization

```typescript
// app/providers.tsx
"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect } from "react";

const APP_ID = "app_e46be27bec413add7207c6d40b28d906";  // From Developer Portal

export function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const result = MiniKit.install(APP_ID);
    console.log("MiniKit install result:", result);
  }, []);

  return <>{children}</>;
}
```

### Step 2: Use correct QR code URL format

Get the exact URL from Developer Portal (it includes your draft_id):

```typescript
// app/page.tsx
if (status === "not-installed") {
  // Use the exact URL format from Developer Portal
  const worldAppUrl = "https://world.org/mini-app?app_id=app_xxx&draft_id=meta_xxx";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(worldAppUrl)}`;

  return (
    <img src={qrCodeUrl} alt="Scan with World App" />
  );
}
```

### Step 3: Match Developer Portal URL

1. Go to https://developer.worldcoin.org
2. Select your app
3. Set **App URL** to your exact deployment URL:
   - For ngrok: `https://xxxx.ngrok.io`
   - For Railway: `https://myapp-production.up.railway.app`
4. Save and wait 2-5 minutes for propagation

## Verification

After applying all fixes:

1. Redeploy your app
2. Go to Developer Portal and use their QR code generator
3. Scan with World App
4. App should open and MiniKit should initialize

## Prevention Checklist

- [ ] Always pass `app_id` to `MiniKit.install()`
- [ ] Use QR URL from Developer Portal (includes draft_id)
- [ ] Keep Developer Portal URL in sync with deployment
- [ ] Test QR code after every deployment
- [ ] Use `world.org` (not `worldcoin.org`) for mini-app URLs

## Related Documentation

- [World Mini App Implementation Guide](/docs/world_related/World%20Mini%20App%20Implementation%20Guide.md)
- [Technical PRD](/docs/Technical%20PRD.md)
- [Official Docs](https://docs.world.org/mini-apps/quick-start/testing)

## Key Files Changed

- `app/providers.tsx` - Added APP_ID to MiniKit.install()
- `app/page.tsx` - Fixed QR code URL format
- Developer Portal - Updated App URL to match Railway deployment
