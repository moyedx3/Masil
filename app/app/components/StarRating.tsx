"use client";

interface StarRatingProps {
  rating: number; // 0 = no rating, 1-5
  onChange: (rating: number) => void;
}

export default function StarRating({ rating, onChange }: StarRatingProps) {
  const handleTap = (star: number) => {
    // Tap same star to clear rating
    onChange(rating === star ? 0 : star);
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleTap(star)}
          className="p-1 transition-transform active:scale-90"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <span className="text-2xl">
            {star <= rating ? "★" : "☆"}
          </span>
        </button>
      ))}
      {rating > 0 && (
        <span className="text-sm text-gray-500 ml-2">{rating}/5</span>
      )}
    </div>
  );
}
