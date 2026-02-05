"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white p-4">
        <div className="animate-pulse max-w-md mx-auto pt-8">
          <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-gray-500 mb-4">{error || "Profile not found"}</p>
        <button
          onClick={() => router.push("/home")}
          className="text-[#FF6B35] font-medium"
        >
          Back to Map
        </button>
      </main>
    );
  }

  const tier = getTrustTier(profile.user.trust_score);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => router.push("/home")}
          className="text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-[#1A1A1A]">My Profile</h1>
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
          <p className="text-xs text-gray-400 mt-2">
            Joined {new Date(profile.user.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.user.trust_score}
            </div>
            <div className="text-xs text-gray-500">Trust Score</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.stats.review_count}
            </div>
            <div className="text-xs text-gray-500">Reviews</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {profile.stats.helpful_votes_received}
            </div>
            <div className="text-xs text-gray-500">Helpful</div>
          </div>
        </div>

        {/* Trust Score Explanation */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">
            How Trust Score Works
          </h3>
          <div className="space-y-1 text-xs text-gray-600">
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
              <p className="text-gray-500 mb-2">No reviews yet</p>
              <button
                onClick={() => router.push("/home")}
                className="text-[#FF6B35] font-medium text-sm"
              >
                Go explore places
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {review.place_name}
                    </span>
                    {review.rating && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${star <= review.rating! ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {review.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
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
