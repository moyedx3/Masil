"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Place } from "@/lib/db";

// Dynamically import Map to avoid SSR issues with Mapbox
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

type Status = "loading" | "ready" | "error";

export default function HomePage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch("/api/places");
      if (!res.ok) {
        throw new Error("Failed to fetch places");
      }
      const data = await res.json();
      setPlaces(data);
      setStatus("ready");
    } catch (error) {
      console.error("Error fetching places:", error);
      setErrorMsg("Failed to load places. Please try again.");
      setStatus("error");
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  // Error state
  if (status === "error") {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-500 mb-4">{errorMsg}</p>
        <button
          onClick={() => {
            setStatus("loading");
            fetchPlaces();
          }}
          className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* Map takes full screen */}
      <div className="absolute inset-0">
        <Map places={places} />
      </div>

      {/* Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-lg font-bold text-[#1A1A1A]">Masil</span>
            <span className="text-sm text-gray-500">마실</span>
            <div className="w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center ml-1">
              <span className="text-xs text-white">✓</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-white rounded-full px-4 py-2 shadow-lg text-gray-600 text-sm"
          >
            {isSigningOut ? "..." : "Sign out"}
          </button>
        </div>
      </header>

      {/* Places count indicator */}
      {status === "ready" && (
        <div className="absolute bottom-6 left-4 z-10">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg text-sm text-gray-600">
            {places.length} places
          </div>
        </div>
      )}
    </main>
  );
}
