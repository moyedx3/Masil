"use client";

interface Tag {
  id: string;
  label: string;
  emoji: string;
}

interface TagCategory {
  name: string;
  tags: Tag[];
}

const TAG_CATEGORIES: TagCategory[] = [
  {
    name: "Communication",
    tags: [
      { id: "english_menu", label: "English menu", emoji: "📋" },
      { id: "english_staff", label: "English staff", emoji: "🗣️" },
      { id: "foreigner_friendly", label: "Foreigner-friendly", emoji: "🌍" },
      { id: "card_ok", label: "Card OK", emoji: "💳" },
    ],
  },
  {
    name: "Practical",
    tags: [
      { id: "free_wifi", label: "Free WiFi", emoji: "📶" },
      { id: "quiet_workspace", label: "Quiet workspace", emoji: "💻" },
      { id: "vegetarian", label: "Vegetarian options", emoji: "🥗" },
      { id: "halal", label: "Halal", emoji: "🍖" },
      { id: "late_night", label: "Late night", emoji: "🌙" },
    ],
  },
  {
    name: "Warnings",
    tags: [
      { id: "cash_only", label: "Cash only", emoji: "💵" },
      { id: "korean_only", label: "Korean only", emoji: "🇰🇷" },
      { id: "long_wait", label: "Long wait", emoji: "⏰" },
      { id: "foreigner_markup", label: "Foreigner markup", emoji: "⚠️" },
    ],
  },
];

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-3">
      {TAG_CATEGORIES.map((category) => (
        <div key={category.name}>
          <p className="text-xs font-medium text-gray-500 mb-2">{category.name}</p>
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              const isWarning = category.name === "Warnings";
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    isSelected
                      ? isWarning
                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
