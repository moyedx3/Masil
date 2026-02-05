"use client";

import { useState } from "react";
import { MiniKit, VerificationLevel } from "@worldcoin/minikit-js";
import FAQ from "./FAQ";

interface AuthGateProps {
  onVerifySuccess: () => void;
}

type AuthStatus = "idle" | "verifying" | "success" | "error";

export default function AuthGate({ onVerifySuccess }: AuthGateProps) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleVerify = async () => {
    setStatus("verifying");
    setErrorMsg("");

    try {
      // Set 30 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Verification timed out")), 30000);
      });

      const verifyPromise = MiniKit.commandsAsync.verify({
        action: "masilauth",
        verification_level: VerificationLevel.Orb,
      });

      const { finalPayload } = await Promise.race([verifyPromise, timeoutPromise]);

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
        // Small delay to show success state before redirecting
        setTimeout(() => {
          onVerifySuccess();
        }, 500);
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Backend verification failed");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      if (e instanceof Error && e.message === "Verification timed out") {
        setErrorMsg("Verification timed out. Please try again.");
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    }
  };

  const handlePayClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2500);
  };

  const handleRetry = () => {
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white relative">
      {/* Coming Soon Toast */}
      {showComingSoon && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium">
            Coming Soon!
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
          Welcome to Masil
        </h1>
        <p className="text-gray-500">
          Verified reviews by real humans
        </p>
      </div>

      {/* World ID Card */}
      <div className="w-full max-w-sm mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-center gap-3 mb-3">
          {/* World ID Logo (simplified) */}
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-[#1A1A1A]">World ID</span>
        </div>
        <p className="text-center text-sm text-gray-600">
          Verify you're a unique human to access trusted reviews
        </p>
      </div>

      {/* Error State */}
      {status === "error" && (
        <div className="w-full max-w-sm mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-red-600 text-sm text-center mb-2">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="w-full text-red-700 text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Success State */}
      {status === "success" && (
        <div className="w-full max-w-sm mb-4 p-4 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-700 text-sm font-medium">Verified! Redirecting...</p>
          </div>
        </div>
      )}

      {/* Primary CTA - Verify with World ID */}
      <button
        onClick={handleVerify}
        disabled={status === "verifying" || status === "success"}
        className="w-full max-w-sm py-4 px-6 rounded-full font-medium text-white text-lg
                   bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]
                   hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-lg mb-4"
      >
        {status === "verifying" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </span>
        ) : status === "success" ? (
          "Verified!"
        ) : (
          "Verify with World ID"
        )}
      </button>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-4 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Secondary CTA - Pay $1 */}
      <button
        onClick={handlePayClick}
        disabled={status === "verifying" || status === "success"}
        className="w-full max-w-sm py-4 px-6 rounded-full font-medium text-[#374151] text-lg
                   bg-white border-2 border-gray-200
                   hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 mb-8"
      >
        Pay $1 for view-only access
      </button>

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-gray-400">
        Proof of humanity + Proof of presence
      </p>
    </main>
  );
}
