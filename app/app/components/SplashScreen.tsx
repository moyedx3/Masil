"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F4EA] transition-opacity duration-300 ${
        state === "fading" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="bg-[#B87C4C] rounded-2xl px-6 py-4 mb-3">
          <Image src="/logo.png" alt="masil." width={200} height={80} className="h-12 w-auto" priority />
        </div>
        <p className="text-xl text-[#778873] font-light mt-1">마실</p>
      </div>

      {/* Tagline */}
      <p className="text-[#778873] text-lg mb-12">Reviews you can trust</p>

      {/* Loading Spinner */}
      <div className="w-8 h-8 border-4 border-[#D2DCB6] border-t-[#B87C4C] rounded-full animate-spin" />
    </div>
  );
}
