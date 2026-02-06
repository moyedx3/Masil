"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, getTrustTier } from "@/lib/db";
import TrustBadge from "@/app/components/TrustBadge";

interface ProfileData {
  user: User;
  stats: {
    review_count: number;
    helpful_votes_received: number;
  };
  reviews: Array<{
    id: string;
    content: string;
    rating: number | null;
    helpful_count: number;
    not_helpful_count: number;
    created_at: string;
    place_name: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        if (res.status === 401) {
          setIsUnverified(true);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch profile");
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/home");
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F7F4EA] pb-20">
        <div className="animate-pulse max-w-md mx-auto pt-12 px-4">
          <div className="h-20 w-20 bg-[#D2DCB6] rounded-full mx-auto mb-4" />
          <div className="h-6 bg-[#D2DCB6] rounded w-1/2 mx-auto mb-2" />
          <div className="h-4 bg-[#D2DCB6] rounded w-1/3 mx-auto mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#D2DCB6] rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Unverified / anonymous user state
  if (isUnverified) {
    return (
      <main className="min-h-screen bg-[#F7F4EA] pb-20">
        <header className="p-4 border-b border-[#D2DCB6]">
          <h1 className="text-lg font-semibold text-[#1A1A1A] text-center">
            Profile
          </h1>
        </header>
        <div className="max-w-sm mx-auto px-4 pt-16 text-center">
          <div className="w-20 h-20 bg-[#F1F3E0] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                fill="#778873"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            Verify to See Your Profile
          </h2>
          <p className="text-sm text-[#778873] mb-6">
            Verify with World ID to post reviews, build your trust score, and
            track your contributions.
          </p>
          <Link
            href="/home"
            className="inline-block bg-[#B87C4C] text-white px-6 py-3 rounded-full font-medium transition-colors hover:opacity-90"
          >
            Go to Map
          </Link>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center p-4 pb-20">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-[#778873] mb-4">{error || "Profile not found"}</p>
        <Link href="/home" className="text-[#B87C4C] font-medium">
          Back to Map
        </Link>
      </main>
    );
  }

  const tier = getTrustTier(profile.user.trust_score);

  return (
    <main className="min-h-screen bg-[#F7F4EA] pb-20">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-[#D2DCB6]">
        <h1 className="text-lg font-semibold text-[#1A1A1A]">My Profile</h1>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-[#778873] text-sm px-3 py-1.5 rounded-full border border-[#D2DCB6] hover:bg-[#EBD9D1] transition-colors disabled:opacity-50"
        >
          {isSigningOut ? "..." : "Sign out"}
        </button>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* Profile Card */}
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${tier.color}15` }}
          >
            🧑
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">
            Anonymous User
          </h2>
          <TrustBadge score={profile.user.trust_score} size="md" />
          <p className="text-xs text-[#778873] mt-2">
            Joined {new Date(profile.user.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#F1F3E0] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.user.trust_score}
            </div>
            <div className="text-xs text-[#778873]">Trust Score</div>
          </div>
          <div className="bg-[#F1F3E0] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.stats.review_count}
            </div>
            <div className="text-xs text-[#778873]">Reviews</div>
          </div>
          <div className="bg-[#F1F3E0] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.stats.helpful_votes_received}
            </div>
            <div className="text-xs text-[#778873]">Helpful</div>
          </div>
        </div>

        {/* Trust Score Explanation */}
        <div className="bg-[#F1F3E0] rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
            How Trust Score Works
          </h3>
          <div className="space-y-1 text-xs text-[#778873]">
            <p>+2 points when someone finds your review helpful</p>
            <p>-3 points when someone marks your review as not helpful</p>
            <p>Score range: 0-100 (starting at 50)</p>
          </div>
        </div>

        {/* My Reviews */}
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">
            My Reviews ({profile.reviews.length})
          </h3>

          {profile.reviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-[#778873] mb-2">No reviews yet</p>
              <Link
                href="/home"
                className="text-[#B87C4C] font-medium text-sm"
              >
                Go explore places
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.reviews.map((review) => (
                <div key={review.id} className="bg-[#F1F3E0] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {review.place_name}
                    </span>
                    {review.rating != null && review.rating > 0 && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${star <= review.rating! ? "text-[#B87C4C]" : "text-[#D2DCB6]"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[#778873] mb-2 line-clamp-2">
                    {review.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#778873]">
                    <span>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {review.helpful_count > 0 && (
                      <span>{review.helpful_count} found helpful</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
