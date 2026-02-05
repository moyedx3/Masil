"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is World ID?",
    answer:
      "World ID is a privacy-preserving digital identity that proves you're a unique human without revealing who you are. It's powered by Worldcoin and uses zero-knowledge proofs.",
  },
  {
    question: "Why do I need to verify?",
    answer:
      "Verification ensures every review comes from a real, unique person. This prevents spam, fake reviews, and manipulation, making Masil a trustworthy source for neighborhood insights.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. World ID uses zero-knowledge proofs, meaning we verify you're human without accessing your personal information. Your identity remains anonymous on Masil.",
  },
  {
    question: "What if I don't have World ID?",
    answer:
      "You can still access Masil by paying a small fee ($1 USDC) for view-only access. This alternative is coming soon!",
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
        Frequently Asked Questions
      </h3>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {FAQ_ITEMS.map((item, index) => (
          <div
            key={index}
            className={`${index !== 0 ? "border-t border-gray-200" : ""}`}
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-[#1A1A1A]">
                {item.question}
              </span>
              <span
                className={`text-gray-400 transition-transform duration-200 ${
                  expandedIndex === index ? "rotate-180" : ""
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandedIndex === index ? "max-h-40" : "max-h-0"
              }`}
            >
              <p className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
