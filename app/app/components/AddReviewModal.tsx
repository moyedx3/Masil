"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Place, CATEGORIES, CategoryKey } from "@/lib/db";
import { haversineDistance, isWithinRange } from "@/lib/geo";
import GPSStatus from "./GPSStatus";
import StarRating from "./StarRating";
import TagSelector from "./TagSelector";

interface AddReviewModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type GPSState = "checking" | "verified" | "too-far" | "denied" | "error";

export default function AddReviewModal({
  place,
  isOpen,
  onClose,
  onSuccess,
}: AddReviewModalProps) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [gpsState, setGpsState] = useState<GPSState>("checking");
  const [distance, setDistance] = useState<number | undefined>();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        const dist = Math.round(
          haversineDistance(lat, lng, place.latitude, place.longitude)
        );
        setDistance(dist);

        if (isWithinRange(lat, lng, place.latitude, place.longitude)) {
          setGpsState("verified");
        } else {
          setGpsState("too-far");
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsState("denied");
        } else {
          setGpsState("error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [place.latitude, place.longitude]);

  // Check GPS on mount and every 10 seconds
  useEffect(() => {
    if (!isOpen) return;

    setGpsState("checking");
    checkGPS();

    gpsIntervalRef.current = setInterval(checkGPS, 10000);

    return () => {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
      }
    };
  }, [isOpen, checkGPS]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent("");
      setRating(0);
      setSelectedTags([]);
      setSubmitError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const canSubmit =
    content.trim().length > 0 &&
    content.length <= 500 &&
    gpsState === "verified" &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || userLat === null || userLng === null) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: place.id,
          content: content.trim(),
          rating: rating > 0 ? rating : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          user_lat: userLat,
          user_lng: userLng,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to post review");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const category = place.category as CategoryKey;
  const categoryInfo = CATEGORIES[category] || CATEGORIES.other;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Add Review</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500 text-lg">✕</span>
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Place info */}
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">{place.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <span>{categoryInfo.emoji}</span>
              <span>{categoryInfo.label}</span>
            </div>
          </div>

          {/* GPS Status */}
          <GPSStatus status={gpsState} distance={distance} />

          {/* Star Rating */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          {/* Review Text */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your review</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="Write your review..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
            />
            <p
              className={`text-xs text-right mt-1 ${
                content.length > 450 ? "text-orange-500" : "text-gray-400"
              }`}
            >
              {content.length}/500
            </p>
          </div>

          {/* Tag Selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Tags <span className="text-gray-400 font-normal">(select all that apply)</span>
            </p>
            <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Error message */}
          {submitError && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 px-4 rounded-full font-medium text-white bg-[#FF6B35] hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              "Post Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
