"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

type SplashState = "visible" | "fading" | "hidden";

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [state, setState] = useState<SplashState>("visible");

  useEffect(() => {
    // Show splash for 1.5 seconds, then fade out
    const visibleTimer = setTimeout(() => {
      setState("fading");
    }, 1500);

    return () => clearTimeout(visibleTimer);
  }, []);

  useEffect(() => {
    if (state === "fading") {
      // After fade animation (300ms), mark as hidden and call onComplete
      const fadeTimer = setTimeout(() => {
        setState("hidden");
        onComplete();
      }, 300);

      return () => clearTimeout(fadeTimer);
    }
  }, [state, onComplete]);

  if (state === "hidden") {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${
        state === "fading" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-[#1A1A1A] tracking-tight">
          Masil
        </h1>
        <p className="text-2xl text-gray-400 font-light mt-1">마실</p>
      </div>

      {/* Tagline */}
      <p className="text-gray-500 text-lg mb-12">Reviews you can trust</p>

      {/* Loading Spinner */}
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin" />
    </div>
  );
}
