import { CATEGORIES, CategoryKey } from "@/lib/db";

interface CategoryIconProps {
  category: CategoryKey;
  size?: number;
}

export default function CategoryIcon({ category, size = 36 }: CategoryIconProps) {
  const info = CATEGORIES[category] || CATEGORIES.other;
  const strokeWidth = size > 30 ? 2.5 : 2;

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16.25" fill={info.color} stroke="white" strokeWidth={strokeWidth} />
      <g transform={`translate(9, 9) scale(${18 / 256})`}>
        <path d={info.iconPath} fill="white" />
      </g>
    </svg>
  );
}
