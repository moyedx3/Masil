"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { useState, useCallback } from "react";
import SplashScreen from "./components/SplashScreen";
import AuthGate from "./components/AuthGate";

type AppState = "splash" | "checking-auth" | "not-installed" | "auth-gate" | "redirecting";

export default function AuthPage() {
  const [appState, setAppState] = useState<AppState>("splash");

  const checkAuthAndMiniKit = useCallback(async () => {
    setAppState("checking-auth");

    // Give MiniKit time to install
    await new Promise((r) => setTimeout(r, 500));

    if (!MiniKit.isInstalled()) {
      setAppState("not-installed");
      return;
    }

    // Check if user already has valid auth cookie
    try {
      const res = await fetch("/api/auth/check");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAppState("redirecting");
          window.location.href = "/home";
          return;
        }
      }
    } catch (e) {
      // If check fails, proceed to auth gate
      console.error("Auth check failed:", e);
    }

    setAppState("auth-gate");
  }, []);

  const handleSplashComplete = useCallback(() => {
    checkAuthAndMiniKit();
  }, [checkAuthAndMiniKit]);

  const handleVerifySuccess = useCallback(() => {
    setAppState("redirecting");
    window.location.href = "/home";
  }, []);

  // Splash screen
  if (appState === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Checking auth state (brief loading)
  if (appState === "checking-auth" || appState === "redirecting") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EA]">
        <div className="w-8 h-8 border-4 border-[#D2DCB6] border-t-[#B87C4C] rounded-full animate-spin" />
      </main>
    );
  }

  // Not in World App - show QR code
  if (appState === "not-installed") {
    // World Mini App QR code format - use world.org (not worldcoin.org) with draft_id for testing
    const worldAppUrl = "https://world.org/mini-app?app_id=app_e46be27bec413add7207c6d40b28d906&draft_id=meta_5ae9007b8a8cda22366093e22bce22e0";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(worldAppUrl)}`;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F7F4EA] text-center">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="bg-[#B87C4C] rounded-2xl px-6 py-4 mb-3">
            <img src="/logo.png" alt="masil." className="h-12" />
          </div>
          <p className="text-xl text-[#778873] font-light mt-1">마실</p>
        </div>

        <p className="text-[#778873] mb-6 max-w-xs">
          Masil is a World Mini App. Please open this link in the World App to
          continue.
        </p>

        <div className="mb-6 p-4 bg-white rounded-xl shadow-lg">
          <img
            src={qrCodeUrl}
            alt="QR Code to open in World App"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>

        <div className="p-4 bg-[#F1F3E0] rounded-xl max-w-xs">
          <p className="text-sm text-[#778873]">
            Scan this QR code with World App to open Masil
          </p>
        </div>
      </main>
    );
  }

  // Auth gate - show verification options
  return <AuthGate onVerifySuccess={handleVerifySuccess} />;
}
