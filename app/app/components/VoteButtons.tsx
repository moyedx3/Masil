"use client";

import { useState } from "react";

interface VoteButtonsProps {
  reviewId: string;
  helpfulCount: number;
  notHelpfulCount: number;
  userVote?: "helpful" | "not_helpful" | null;
  isOwnReview: boolean;
}

export default function VoteButtons({
  reviewId,
  helpfulCount: initialHelpful,
  notHelpfulCount: initialNotHelpful,
  userVote: initialVote = null,
  isOwnReview,
}: VoteButtonsProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpful);
  const [notHelpfulCount, setNotHelpfulCount] = useState(initialNotHelpful);
  const [userVote, setUserVote] = useState(initialVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    if (isOwnReview || isSubmitting) return;

    const newVote = isHelpful ? "helpful" : "not_helpful";

    // If already voted the same way, ignore
    if (userVote === newVote) return;

    // Optimistic update
    const prevHelpful = helpfulCount;
    const prevNotHelpful = notHelpfulCount;
    const prevVote = userVote;

    if (userVote === "helpful") setHelpfulCount((c) => c - 1);
    if (userVote === "not_helpful") setNotHelpfulCount((c) => c - 1);
    if (isHelpful) setHelpfulCount((c) => c + 1);
    else setNotHelpfulCount((c) => c + 1);
    setUserVote(newVote);

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_helpful: isHelpful }),
      });

      if (!res.ok) {
        // Rollback
        setHelpfulCount(prevHelpful);
        setNotHelpfulCount(prevNotHelpful);
        setUserVote(prevVote);
      } else {
        const data = await res.json();
        setHelpfulCount(data.review.helpful_count);
        setNotHelpfulCount(data.review.not_helpful_count);
      }
    } catch {
      // Rollback on error
      setHelpfulCount(prevHelpful);
      setNotHelpfulCount(prevNotHelpful);
      setUserVote(prevVote);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOwnReview) {
    return (
      <div className="flex items-center gap-4 pt-2 border-t border-[#D2DCB6]">
        <span className="text-xs text-[#778873]">Your review</span>
        {helpfulCount > 0 && (
          <span className="text-xs text-[#778873]">
            {helpfulCount} found helpful
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 pt-2 border-t border-[#D2DCB6]">
      <button
        onClick={() => handleVote(true)}
        disabled={isSubmitting}
        className={`flex items-center gap-1.5 transition-colors ${
          userVote === "helpful"
            ? "text-[#A1BC98]"
            : "text-[#778873] hover:text-[#A1BC98]"
        }`}
      >
        <span>👍</span>
        <span className="text-xs">Helpful</span>
        {helpfulCount > 0 && (
          <span className="text-xs">({helpfulCount})</span>
        )}
        {userVote === "helpful" && <span className="text-xs">✓</span>}
      </button>

      <button
        onClick={() => handleVote(false)}
        disabled={isSubmitting}
        className={`flex items-center gap-1.5 transition-colors ${
          userVote === "not_helpful"
            ? "text-red-500"
            : "text-[#778873] hover:text-red-500"
        }`}
      >
        <span>👎</span>
        {notHelpfulCount > 0 && (
          <span className="text-xs">({notHelpfulCount})</span>
        )}
        {userVote === "not_helpful" && <span className="text-xs">✓</span>}
      </button>
    </div>
  );
}
