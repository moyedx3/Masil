"use client";

import { Place, Review, CATEGORIES, CategoryKey } from "@/lib/db";
import ReviewCard from "./ReviewCard";

interface PlaceDetailProps {
  place: Place;
  reviews: Review[];
  isLoading?: boolean;
}

export default function PlaceDetail({
  place,
  reviews,
  isLoading = false,
}: PlaceDetailProps) {
  const category = place.category as CategoryKey;
  const categoryInfo = CATEGORIES[category] || CATEGORIES.other;

  // Open Google Maps directions
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${place.google_place_id || ""}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-6" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
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
          <p className="text-sm text-gray-500 mb-2">{place.name_korean}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{categoryInfo.emoji}</span>
          <span>{categoryInfo.label}</span>
        </div>
      </div>

      {/* Address */}
      {place.address && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-400">📍</span>
          <span className="text-sm text-gray-600">{place.address}</span>
        </div>
      )}

      {/* Get Directions Button */}
      <button
        onClick={handleGetDirections}
        className="w-full bg-[#1A1A1A] text-white py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 mb-6 hover:bg-gray-800 transition-colors"
      >
        <span>🧭</span>
        <span>Get Directions</span>
      </button>

      {/* Reviews Section */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
          Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 mb-2">No reviews yet.</p>
            <p className="text-sm text-gray-400">Be the first to share your experience!</p>
          </div>
        ) : (
          <div>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Add Review CTA */}
      <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 mt-4">
        <button
          className="w-full bg-[#FF6B35] text-white py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
          onClick={() => {/* Will be implemented in Add Review feature */}}
        >
          <span>📝</span>
          <span>Add Your Review</span>
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Requires GPS verification within 50m
        </p>
      </div>
    </div>
  );
}
