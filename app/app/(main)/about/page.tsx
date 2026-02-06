"use client";

import Image from "next/image";
import FAQ from "@/app/components/FAQ";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EA] pb-20">
      {/* Hero */}
      <div className="pt-12 pb-8 px-4 text-center">
        <div className="inline-block bg-[#B87C4C] rounded-2xl px-5 py-3 mb-4">
          <Image
            src="/logo.png"
            alt="masil."
            width={160}
            height={64}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-[#778873] text-sm max-w-xs mx-auto">
          Your neighborhood guide in Korea. Real reviews from verified humans.
        </p>
      </div>

      <div className="max-w-sm mx-auto px-4">
        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 text-center">
            How It Works
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-[#F1F3E0] rounded-xl p-4">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  Browse the Map
                </h3>
                <p className="text-xs text-[#778873]">
                  Explore restaurants, cafes, pharmacies, and more in Jongno-gu
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#F1F3E0] rounded-xl p-4">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  Read Reviews
                </h3>
                <p className="text-xs text-[#778873]">
                  See what other verified foreigners think about local spots
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#F1F3E0] rounded-xl p-4">
              <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  Share Your Experience
                </h3>
                <p className="text-xs text-[#778873]">
                  Verify with World ID and post GPS-verified reviews
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Score */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 text-center">
            Trust Score
          </h2>
          <div className="bg-[#F1F3E0] rounded-xl p-4">
            <p className="text-sm text-[#778873] mb-3">
              Every reviewer has a trust score (0-100) that reflects the quality
              of their contributions.
            </p>
            <div className="space-y-1 text-xs text-[#778873]">
              <p>+2 points when someone finds your review helpful</p>
              <p>-3 points when marked as not helpful</p>
              <p>New users start at 50</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8 flex justify-center">
          <FAQ />
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-4 border-t border-[#D2DCB6]">
          <p className="text-xs text-[#778873]">
            Built for World Build Korea 2026
          </p>
          <p className="text-xs text-[#778873] mt-1">
            Powered by World ID
          </p>
        </footer>
      </div>
    </main>
  );
}
