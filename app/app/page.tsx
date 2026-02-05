"use client";

import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";
import { useState, useEffect } from "react";

type Status = "loading" | "not-installed" | "idle" | "verifying" | "success" | "error";

export default function AuthPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // Wait for MiniKit to initialize
    const checkMiniKit = async () => {
      // Give MiniKit time to install
      await new Promise((r) => setTimeout(r, 500));

      if (MiniKit.isInstalled()) {
        setStatus("idle");
      } else {
        setStatus("not-installed");
      }
    };

    checkMiniKit();
  }, []);

  const handleVerify = async () => {
    setStatus("verifying");
    setErrorMsg("");

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: "masilauth",
        verification_level: VerificationLevel.Orb,
      });

      if (finalPayload.status === "error") {
        setStatus("error");
        setErrorMsg("Verification was cancelled or failed");
        return;
      }

      // Verify on backend
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload,
          action: "masilauth",
        }),
      });

      if (res.ok) {
        setStatus("success");
        window.location.href = "/home";
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Backend verification failed");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("An unexpected error occurred");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin" />
      </main>
    );
  }

  // Not in World App
  if (status === "not-installed") {
    // World Mini App QR code format - use world.org (not worldcoin.org) with draft_id for testing
    const worldAppUrl = "https://world.org/mini-app?app_id=app_e46be27bec413add7207c6d40b28d906&draft_id=meta_5ae9007b8a8cda22366093e22bce22e0";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(worldAppUrl)}`;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-center">
        <h1 className="text-3xl font-bold mb-4 text-[#1A1A1A]">Masil</h1>
        <p className="text-gray-500 mb-6 max-w-xs">
          Masil is a World Mini App. Please open this link in the World App to continue.
        </p>

        {/* QR Code */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-lg">
          <img
            src={qrCodeUrl}
            alt="QR Code to open in World App"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>

        <div className="p-4 bg-gray-100 rounded-lg max-w-xs">
          <p className="text-sm text-gray-600">
            Scan this QR code with World App to open Masil
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Masil</h1>
        <p className="text-lg text-gray-500">마실</p>
      </div>

      {/* Tagline */}
      <p className="text-gray-600 mb-8 text-center max-w-xs">
        Verified neighborhood reviews by real humans, for foreigners in Korea
      </p>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={status === "verifying" || status === "success"}
        className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-lg font-medium
                   hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-lg"
      >
        {status === "verifying" ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </span>
        ) : status === "success" ? (
          "Verified! Redirecting..."
        ) : (
          "Verify with World ID"
        )}
      </button>

      {/* Error Message */}
      {status === "error" && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg max-w-xs text-center">
          <p className="text-red-600 text-sm">{errorMsg || "Verification failed"}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 text-red-700 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="absolute bottom-8 text-xs text-gray-400">
        Proof of humanity + Proof of presence
      </p>
    </main>
  );
}
