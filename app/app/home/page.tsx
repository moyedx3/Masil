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

interface UserInfo {
  nullifier_hash: string;
  trust_score: number;
  review_count: number;
}

type Status = "loading" | "ready" | "error";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showUserCard, setShowUserCard] = useState(false);

  useEffect(() => {
    // Get user info from cookie
    const authCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth="));

    if (authCookie) {
      const nullifier = authCookie.split("=")[1];
      setUser({
        nullifier_hash: nullifier,
        trust_score: 50,
        review_count: 0,
      });
    }

    // Fetch places
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

  const truncateHash = (hash: string) => {
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
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
          <button
            onClick={() => setShowUserCard(!showUserCard)}
            className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <span className="text-lg font-bold text-[#1A1A1A]">Masil</span>
            <span className="text-sm text-gray-500">마실</span>
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-white rounded-full px-4 py-2 shadow-lg text-gray-600 text-sm"
          >
            {isSigningOut ? "..." : "Sign out"}
          </button>
        </div>
      </header>

      {/* User card overlay (toggleable) */}
      {showUserCard && user && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="bg-white rounded-2xl p-4 shadow-lg max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#22C55E] rounded-full flex items-center justify-center">
                <span className="text-xl text-white">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verified Human</p>
                <p className="font-mono text-xs text-gray-400">
                  {truncateHash(user.nullifier_hash)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#1A1A1A]">
                  {user.trust_score}
                </p>
                <p className="text-xs text-gray-500">Trust Score</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#1A1A1A]">
                  {user.review_count}
                </p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
