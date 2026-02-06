"use client";

import { useMemo } from "react";
import { Place, Review, HelpfulnessVote, CATEGORIES, CategoryKey, AccessTier } from "@/lib/db";
import ReviewCard from "./ReviewCard";
import CategoryIcon from "./CategoryIcon";

type AuthTier = AccessTier | "anonymous";

interface PlaceDetailProps {
  place: Place;
  reviews: Review[];
  isLoading?: boolean;
  onAddReview?: () => void;
  onRequestAuth?: () => void;
  currentUserNullifier?: string | null;
  userVotes?: HelpfulnessVote[];
  authTier?: AuthTier;
}

export default function PlaceDetail({
  place,
  reviews,
  isLoading = false,
  onAddReview,
  onRequestAuth,
  currentUserNullifier,
  userVotes = [],
  authTier = "orb",
}: PlaceDetailProps) {
  const category = place.category as CategoryKey;
  const categoryInfo = CATEGORIES[category] || CATEGORIES.other;
  const isUnlocked = authTier === "orb" || authTier === "paid";

  const voteMap = useMemo(() => new Map(
    userVotes.map((v) => [v.review_id, v.is_helpful ? "helpful" as const : "not_helpful" as const])
  ), [userVotes]);

  // Open Google Maps directions
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${place.google_place_id || ""}`;
    window.open(url, "_blank");
  };

  // Handle write review tap — orb users go straight, others get auth prompt
  const handleWriteReviewTap = () => {
    if (authTier === "orb" && onAddReview) {
      onAddReview();
    } else if (onRequestAuth) {
      onRequestAuth();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-[#D2DCB6] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#D2DCB6] rounded w-1/2 mb-4" />
        <div className="h-10 bg-[#D2DCB6] rounded mb-6" />
        <div className="h-4 bg-[#D2DCB6] rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#D2DCB6] rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Place Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">{place.name}</h2>
        {place.name_korean && (
          <p className="text-sm text-[#778873] mb-2">{place.name_korean}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-[#778873]">
          <CategoryIcon category={category} size={24} />
          <span>{categoryInfo.label}</span>
        </div>
      </div>

      {/* Address */}
      {place.address && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-[#F1F3E0] rounded-lg">
          <span className="text-[#A1BC98]">📍</span>
          <span className="text-sm text-[#778873]">{place.address}</span>
        </div>
      )}

      {/* Get Directions Button */}
      <button
        onClick={handleGetDirections}
        className="w-full bg-[#B87C4C] text-white py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 mb-6 hover:opacity-90 transition-colors"
      >
        <span>🧭</span>
        <span>Get Directions</span>
      </button>

      {/* Add Review CTA - visible to everyone, behavior varies by auth tier */}
      <button
        className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#D2DCB6] text-[#778873] font-medium flex items-center justify-center gap-2 hover:border-[#B87C4C] hover:text-[#B87C4C] transition-colors mb-4"
        onClick={handleWriteReviewTap}
      >
        <span>📝</span>
        <span>What do you think?</span>
      </button>

      {/* Reviews Section */}
      <div className="border-t border-[#D2DCB6] pt-4">
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
          Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[#778873] mb-2">No reviews yet.</p>
            <p className="text-sm text-[#778873]">Be the first to share your experience!</p>
          </div>
        ) : (
          <div>
            {/* Unlock CTA card — first slot for anonymous users */}
            {authTier === "anonymous" && onRequestAuth && (
              <div className="bg-gradient-to-b from-[#F1F3E0] to-[#EBD9D1] rounded-xl p-5 mb-3 border border-[#D2DCB6]">
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg">🔒</span>
                  </div>
                  <h4 className="font-bold text-[#1A1A1A] mb-1">Unlock Reviews</h4>
                  <p className="text-sm text-[#778873] mb-4">
                    Verify you&apos;re human to read trusted neighborhood reviews
                  </p>
                  <button
                    onClick={onRequestAuth}
                    className="w-full py-3 px-4 rounded-full font-medium text-white text-sm
                               bg-[#B87C4C]
                               hover:opacity-90 transition-all shadow-md mb-2"
                  >
                    Verify with World ID
                  </button>
                  <button
                    onClick={onRequestAuth}
                    className="w-full py-2.5 px-4 rounded-full font-medium text-[#778873] text-sm
                               border border-[#D2DCB6] hover:bg-white/50 transition-all"
                  >
                    Pay $0.10 to read
                  </button>
                </div>
              </div>
            )}

            {/* Review cards */}
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserNullifier={currentUserNullifier}
                userVote={isUnlocked ? voteMap.get(review.id) : undefined}
                blurred={!isUnlocked}
                showVotes={authTier === "orb"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
