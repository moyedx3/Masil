"use client";

import { useState } from "react";
import { Review } from "@/lib/db";
import TrustBadge from "./TrustBadge";
import VoteButtons from "./VoteButtons";

interface ReviewCardProps {
  review: Review;
  currentUserNullifier?: string | null;
  userVote?: "helpful" | "not_helpful" | null;
  authorTrustScore?: number | null;
}

// Anonymize author name: "John Doe" -> "J***n D."
function anonymizeAuthor(name: string | null): string {
  if (!name) return "Anonymous";

  const parts = name.trim().split(" ");
  if (parts.length === 0) return "Anonymous";

  const anonymizePart = (part: string): string => {
    if (part.length <= 2) return part;
    return part[0] + "***" + part[part.length - 1];
  };

  if (parts.length === 1) {
    return anonymizePart(parts[0]);
  }

  // First name anonymized + last initial
  const firstName = anonymizePart(parts[0]);
  const lastInitial = parts[parts.length - 1][0] + ".";

  return `${firstName} ${lastInitial}`;
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

// Render star rating
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-[#B87C4C]" : "text-[#D2DCB6]"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  currentUserNullifier,
  userVote,
  authorTrustScore,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isImported = review.source === "imported";
  const isOwnReview = !!(currentUserNullifier && review.user_nullifier === currentUserNullifier);
  const contentLimit = 200;
  const isLongContent = review.content.length > contentLimit;

  const displayContent = isExpanded || !isLongContent
    ? review.content
    : review.content.slice(0, contentLimit) + "...";

  return (
    <div className="bg-[#F1F3E0] rounded-xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Google icon for imported reviews */}
          {isImported && (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-[#D2DCB6]">
              <span className="text-xs font-bold text-[#778873]">G</span>
            </div>
          )}

          {/* Author name */}
          <span className="font-medium text-[#1A1A1A]">
            {isImported
              ? anonymizeAuthor(review.original_author)
              : "Anonymous User"}
          </span>
          {!isImported && authorTrustScore != null && (
            <TrustBadge score={authorTrustScore} showLabel={false} />
          )}
        </div>

        {/* Time */}
        <span className="text-xs text-[#778873]">
          {formatRelativeTime(review.created_at)}
        </span>
      </div>

      {/* Imported badge */}
      {isImported && (
        <div className="inline-flex items-center gap-1 bg-[#EBD9D1] text-[#778873] text-xs px-2 py-1 rounded-full mb-2">
          <span>📥</span>
          <span>Imported via Google Maps</span>
        </div>
      )}

      {/* Rating */}
      {review.rating != null && review.rating > 0 && (
        <div className="mb-2">
          <StarRating rating={review.rating} />
        </div>
      )}

      {/* Content */}
      <p className="text-[#1A1A1A] text-sm leading-relaxed mb-3">
        {displayContent}
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#B87C4C] ml-1 font-medium"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </p>

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {review.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-[#D2DCB6] text-[#778873] text-xs px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Vote buttons */}
      <VoteButtons
        reviewId={review.id}
        helpfulCount={review.helpful_count}
        notHelpfulCount={review.not_helpful_count}
        userVote={userVote}
        isOwnReview={isOwnReview}
      />
    </div>
  );
}
