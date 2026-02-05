# World Mini App Implementation Guide

Complete reference for building World Mini Apps with MiniKit SDK.

---

## Quick Start

### Create New Project
```bash
npx @worldcoin/create-mini-app@latest my-mini-app
```
Uses Next.js 15, pnpm recommended.

### Manual Installation
```bash
pnpm install @worldcoin/minikit-js
```

### CDN (Vanilla JS)
```html
<script type="module">
  import { MiniKit } from "https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@latest/+esm";
</script>
```

---

## Setup & Configuration

### MiniKitProvider (Required for React/Next.js)

```tsx
// app/layout.tsx
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <MiniKitProvider>
        <body>{children}</body>
      </MiniKitProvider>
    </html>
  );
}
```

### Check if Running in World App

```tsx
import { MiniKit } from "@worldcoin/minikit-js";

if (MiniKit.isInstalled()) {
  // Running inside World App
}
```

---

## MiniKit Object Structure

```tsx
MiniKit = {
  user: {
    walletAddress?: string;
    username?: string;
    profilePictureUrl?: string;
    permissions?: {
      notifications: boolean;
      contacts: boolean;
      microphone: boolean;
    };
    optedIntoOptionalAnalytics?: boolean;
  } | null;

  deviceProperties: {
    safeAreaInsets?: { top, right, bottom, left };
    deviceOS?: string;
    worldAppVersion?: number;
  } | null;

  launchLocation: 'chat' | 'home' | 'app-store' | 'deep-link' | 'wallet-tab' | null;
};
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `verify` | Request World ID proof |
| `pay` | Initiate payment (WLD/USDC) |
| `walletAuth` | SIWE authentication |
| `sendTransaction` | Smart contract interaction |
| `signMessage` | Sign personal messages |
| `shareContacts` | Share user contacts |
| `requestPermission` | Request notifications/microphone |
| `getPermissions` | Get current permissions |
| `sendHapticFeedback` | Trigger device haptics |
| `share` | Native OS share modal |

---

## Response Handling

### Async Pattern (Recommended)

```tsx
const { finalPayload } = await MiniKit.commandsAsync.verify(payload);

if (finalPayload.status === "error") {
  console.log("Error:", finalPayload);
  return;
}

// Success - verify on backend
await fetch("/api/verify", {
  method: "POST",
  body: JSON.stringify(finalPayload),
});
```

### Event Listener Pattern

```tsx
useEffect(() => {
  MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, async (payload) => {
    if (payload.status === "error") return;
    // Handle success
  });

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
  };
}, []);

// Trigger command
MiniKit.commands.verify(payload);
```

---

## World ID Verification

### 1. Create Action in Developer Portal
Create an "incognito action" at https://developer.worldcoin.org

### 2. Frontend: Request Verification

```tsx
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";

const verifyUser = async () => {
  const { finalPayload } = await MiniKit.commandsAsync.verify({
    action: 'your-action-id',           // From Developer Portal
    signal: 'optional-data',            // Optional
    verification_level: VerificationLevel.Orb  // or Device
  });

  if (finalPayload.status === 'success') {
    // Send to backend for verification
    await fetch('/api/verify', {
      method: 'POST',
      body: JSON.stringify(finalPayload)
    });
  }
};
```

### 3. Success Payload

```ts
type VerifySuccessPayload = {
  status: 'success';
  proof: string;
  merkle_root: string;
  nullifier_hash: string;      // Unique user identifier per app
  verification_level: 'orb' | 'device';
  version: number;
};
```

### 4. Backend: Verify Proof (CRITICAL)

```ts
// app/api/verify/route.ts
import { verifyCloudProof } from '@worldcoin/minikit-js';

export async function POST(req: NextRequest) {
  const { payload, action, signal } = await req.json();
  const app_id = process.env.APP_ID;

  const verifyRes = await verifyCloudProof(payload, app_id, action, signal);

  if (verifyRes.success) {
    // Store nullifier_hash to identify user
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}
```

**IMPORTANT:** Always verify proofs server-side. Frontend data is user-manipulable.

---

## Wallet Authentication (SIWE)

Recommended auth method - provides wallet address, username, profile.

### 1. Backend: Generate Nonce

```ts
// app/api/nonce/route.ts
export function GET(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  cookies().set("siwe", nonce, { secure: true });
  return NextResponse.json({ nonce });
}
```

Nonce must be at least 8 alphanumeric characters.

### 2. Frontend: Request Auth

```tsx
const signIn = async () => {
  // Get nonce from backend
  const res = await fetch('/api/nonce');
  const { nonce } = await res.json();

  const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
    nonce: nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: 'Sign in to Masil',
  });

  if (finalPayload.status === 'success') {
    await fetch('/api/complete-siwe', {
      method: 'POST',
      body: JSON.stringify({ payload: finalPayload, nonce })
    });
  }
};
```

### 3. Success Payload

```ts
type WalletAuthSuccessPayload = {
  status: 'success';
  message: string;
  signature: string;
  address: string;      // User's wallet address
  version: number;
};
```

### 4. Backend: Verify Signature

```ts
// app/api/complete-siwe/route.ts
import { verifySiweMessage } from '@worldcoin/minikit-js';

export async function POST(req: NextRequest) {
  const { payload, nonce } = await req.json();

  // Verify nonce matches
  if (nonce !== cookies().get("siwe")?.value) {
    return NextResponse.json({ error: "Invalid nonce" }, { status: 400 });
  }

  const result = await verifySiweMessage(payload, nonce);

  if (result.isValid) {
    // Create session, store user
    return NextResponse.json({ success: true, address: payload.address });
  }

  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}
```

### Access Wallet Address Directly

```tsx
const walletAddress = MiniKit.walletAddress;
// or
const walletAddress = MiniKit.user?.walletAddress;
```

---

## Payments

Supports WLD and USDC on World Chain. Gas fees sponsored by World App.

### Constraints
- Minimum: $0.10 per token
- Not available in Indonesia and Philippines
- Must whitelist recipient address in Developer Portal

### 1. Backend: Initialize Payment

```ts
// app/api/initiate-payment/route.ts
export async function POST(req: NextRequest) {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  // Store in database for verification
  await db.payments.create({ reference: uuid, status: 'pending' });
  return NextResponse.json({ id: uuid });
}
```

### 2. Frontend: Send Payment

```tsx
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";

const sendPayment = async () => {
  // Get reference from backend
  const res = await fetch('/api/initiate-payment', { method: 'POST' });
  const { id } = await res.json();

  const { finalPayload } = await MiniKit.commandsAsync.pay({
    reference: id,
    to: '0xYOUR_WHITELISTED_ADDRESS',
    tokens: [
      {
        symbol: Tokens.USDC,
        token_amount: tokenToDecimals(1, Tokens.USDC).toString()  // $1 USDC
      }
    ],
    description: 'Masil - View access'
  });

  if (finalPayload.status === 'success') {
    // Verify payment on backend
    await fetch('/api/confirm-payment', {
      method: 'POST',
      body: JSON.stringify(finalPayload)
    });
  }
};
```

### 3. Backend: Verify Payment

```ts
// app/api/confirm-payment/route.ts
export async function POST(req: NextRequest) {
  const { payload } = await req.json();

  // Verify reference matches
  const payment = await db.payments.findByReference(payload.reference);
  if (!payment) {
    return NextResponse.json({ error: "Unknown payment" }, { status: 400 });
  }

  // Verify with World API
  const response = await fetch(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`
      }
    }
  );

  const transaction = await response.json();

  if (transaction.reference === payload.reference && transaction.status !== 'failed') {
    await db.payments.update(payment.id, { status: 'completed' });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Payment failed" }, { status: 400 });
}
```

**IMPORTANT:** Response does not wait until transaction is mined. Always verify on backend.

---

## Testing

### Local Development

1. Run dev server: `pnpm dev`
2. Create tunnel: `ngrok http 3000`
3. Add tunnel URL to Developer Portal
4. Generate QR code with your App ID
5. Scan with World App

### QR Code URL Format
```
https://worldcoin.org/mini-app?app_id=app_xxxxxxxxxx
```

### Debugging Tools
- **Eruda** (https://github.com/liriliri/eruda) - Console logs on mobile
- **Ngrok** (https://ngrok.com/) - HTTP tunneling
- **L2 Faucet** (https://www.l2faucet.com/world) - Testnet WLD on Sepolia

---

## Helper Functions

```tsx
// Get user by wallet address
const user = await MiniKit.getUserByAddress('0x...');

// Get user by username
const user = await MiniKit.getUserByUsername('username');

// User object
type User = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  permissions?: {
    notifications: boolean;
    contacts: boolean;
  };
};
```

---

## Environment Variables

```env
APP_ID=app_xxxxxxxxxx
DEV_PORTAL_API_KEY=your_api_key
```

---

## Common Patterns

### Check Verification Level

```tsx
if (finalPayload.verification_level === 'orb') {
  // Orb-verified user - highest trust
} else if (finalPayload.verification_level === 'device') {
  // Device-verified only
}
```

### Store User by Nullifier Hash

```ts
// nullifier_hash is unique per user per app
// Use as primary identifier for anonymous users
await db.users.upsert({
  nullifier_hash: payload.nullifier_hash,
  verification_level: payload.verification_level,
});
```

---

## Resources

- **Official Docs**: https://docs.world.org/mini-apps
- **MiniKit SDK**: https://github.com/worldcoin/minikit-js
- **Developer Portal**: https://developer.worldcoin.org
- **Full Docs Index**: https://docs.world.org/llms.txt
