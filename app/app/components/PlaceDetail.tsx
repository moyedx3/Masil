"use client";

import { Place, Review, HelpfulnessVote, CATEGORIES, CategoryKey } from "@/lib/db";
import ReviewCard from "./ReviewCard";

interface PlaceDetailProps {
  place: Place;
  reviews: Review[];
  isLoading?: boolean;
  onAddReview?: () => void;
  currentUserNullifier?: string | null;
  userVotes?: HelpfulnessVote[];
}

export default function PlaceDetail({
  place,
  reviews,
  isLoading = false,
  onAddReview,
  currentUserNullifier,
  userVotes = [],
}: PlaceDetailProps) {
  const category = place.category as CategoryKey;
  const categoryInfo = CATEGORIES[category] || CATEGORIES.other;

  const voteMap = new Map(
    userVotes.map((v) => [v.review_id, v.is_helpful ? "helpful" as const : "not_helpful" as const])
  );

  // Open Google Maps directions
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${place.google_place_id || ""}`;
    window.open(url, "_blank");
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
          <span>{categoryInfo.emoji}</span>
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
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserNullifier={currentUserNullifier}
                userVote={voteMap.get(review.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Review CTA */}
      <div className="sticky bottom-0 bg-[#F7F4EA] pt-4 pb-2 border-t border-[#D2DCB6] mt-4">
        <button
          className="w-full bg-[#B87C4C] text-white py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-colors"
          onClick={onAddReview}
        >
          <span>📝</span>
          <span>Add Your Review</span>
        </button>
        <p className="text-xs text-[#778873] text-center mt-2">
          Requires GPS verification within 50m
        </p>
      </div>
    </div>
  );
}
