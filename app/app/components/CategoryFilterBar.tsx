"use client";

import { useMemo } from "react";
import { Place, CATEGORIES, CategoryKey } from "@/lib/db";
import CategoryIcon from "./CategoryIcon";

interface CategoryFilterBarProps {
  places: Place[];
  selectedCategory: CategoryKey | null;
  onSelectCategory: (category: CategoryKey) => void;
}

export default function CategoryFilterBar({
  places,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterBarProps) {
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const place of places) {
      categorySet.add(place.category);
    }
    // Return only CategoryKeys that exist in CATEGORIES and have data
    return (Object.keys(CATEGORIES) as CategoryKey[]).filter((key) =>
      categorySet.has(key)
    );
  }, [places]);

  // Hide if fewer than 2 categories have data
  if (availableCategories.length < 2) return null;

  return (
    <div className="absolute top-4 left-0 right-0 z-10 flex justify-center px-4">
      <div
        className="flex gap-2 bg-[#F7F4EA]/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg overflow-x-auto"
        role="radiogroup"
        aria-label="Filter by category"
        style={{ scrollbarWidth: "none" }}
      >
        {availableCategories.map((key) => {
          const isActive = selectedCategory === key;
          const info = CATEGORIES[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectCategory(key)}
              aria-label={`Filter by ${info.label}`}
              aria-pressed={isActive}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 border-2 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive ? "" : "border-transparent hover:bg-[#EBD9D1]/50"
              }`}
              style={
                isActive
                  ? {
                      borderColor: info.color,
                      backgroundColor: `${info.color}20`,
                    }
                  : undefined
              }
            >
              <CategoryIcon category={key} size={28} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
