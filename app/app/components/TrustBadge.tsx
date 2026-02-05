"use client";

import { getTrustTier } from "@/lib/db";

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function TrustBadge({
  score,
  size = "sm",
  showLabel = true,
}: TrustBadgeProps) {
  const tier = getTrustTier(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: tier.color }}
      />
      <span>{score}</span>
      {showLabel && <span>{tier.label}</span>}
    </div>
  );
}
