"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  nullifier_hash: string;
  trust_score: number;
  review_count: number;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Get user info from cookie (just for display - real auth is server-side)
    const authCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth="));

    if (authCookie) {
      const nullifier = authCookie.split("=")[1];
      // For now, show basic info. In production, fetch full user from API
      setUser({
        nullifier_hash: nullifier,
        trust_score: 50, // Default for new users
        review_count: 0,
      });
    }
  }, []);

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

  // Truncate nullifier for display
  const truncateHash = (hash: string) => {
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Masil</h1>
          <p className="text-sm text-gray-500">마실</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      {/* User Card */}
      {user && (
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified Human</p>
              <p className="font-mono text-xs text-gray-400">
                {truncateHash(user.nullifier_hash)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {user.trust_score}
              </p>
              <p className="text-sm text-gray-500">Trust Score</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {user.review_count}
              </p>
              <p className="text-sm text-gray-500">Reviews</p>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Map Coming Soon
        </h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          Explore verified reviews of places in Jongno-gu, Seoul. Written by real humans, for foreigners in Korea.
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">
          World Build Korea 2026
        </p>
      </footer>
    </main>
  );
}
