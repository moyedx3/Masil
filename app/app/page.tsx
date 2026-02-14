"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import SplashScreen from "./components/SplashScreen";

type AppState = "splash" | "checking" | "not-installed" | "redirecting";

export default function LandingPage() {
  const [appState, setAppState] = useState<AppState>("splash");

  const checkAndRedirect = useCallback(async () => {
    setAppState("checking");
    await new Promise((r) => setTimeout(r, 500));

    if (!MiniKit.isInstalled()) {
      setAppState("not-installed");
      return;
    }

    setAppState("redirecting");
    window.location.href = "/home";
  }, []);

  const handleSplashComplete = useCallback(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  if (appState === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (appState === "checking" || appState === "redirecting") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EA]">
        <div className="w-8 h-8 border-4 border-[#D2DCB6] border-t-[#B87C4C] rounded-full animate-spin" />
      </main>
    );
  }

  const worldAppUrl =
    "https://world.org/mini-app?app_id=app_e46be27bec413add7207c6d40b28d906&draft_id=meta_5ae9007b8a8cda22366093e22bce22e0";

  return (
    <main className="bg-[#F7F4EA] overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="min-h-dvh flex flex-col items-center justify-center px-6 pt-16 pb-10 relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#B87C4C]/10 border border-[#B87C4C]/20 rounded-full px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-medium text-[#B87C4C]">World Build Korea 2026</span>
        </div>

        {/* Logo */}
        <div className="bg-[#B87C4C] rounded-2xl px-7 py-4 mb-8 shadow-md">
          <Image src="/logo.png" alt="masil." width={200} height={80} className="h-9 w-auto" priority />
        </div>

        {/* Headline */}
        <h1 className="text-[28px] font-bold text-[#1A1A1A] text-center leading-[1.2] mb-3 max-w-[320px]">
          Real reviews from<br />real people, really there.
        </h1>
        <p className="text-[#778873] text-center text-[15px] mb-10 max-w-[300px] leading-relaxed">
          GPS-verified neighborhood reviews for foreigners in Korea — powered by World&nbsp;ID.
        </p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(worldAppUrl)}`}
            alt="Scan to open Masil"
            width={180}
            height={180}
            className="rounded-xl"
          />
        </div>

        <p className="text-sm font-medium text-[#1A1A1A] mb-1">Scan to open in World App</p>
        <p className="text-xs text-[#A8BBA3]">
          No World App?{" "}
          <a
            href="https://world.org/download"
            className="text-[#B87C4C] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get it here
          </a>
        </p>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce-slow">
          <span className="text-[11px] text-[#A8BBA3] font-medium">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="#A8BBA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto grid grid-cols-3 gap-3">
          <FadeIn>
            <ValueCard icon="gps" title="GPS-Verified" desc="Must be within 50m to review" />
          </FadeIn>
          <FadeIn delay={100}>
            <ValueCard icon="id" title="Real Humans" desc="World ID proof of personhood" />
          </FadeIn>
          <FadeIn delay={200}>
            <ValueCard icon="trust" title="Trust Score" desc="Earn credibility over time" />
          </FadeIn>
        </div>
      </section>

      {/* ── Screenshot Carousel ── */}
      <section className="pb-20">
        <FadeIn>
          <h2 className="text-lg font-bold text-[#1A1A1A] text-center mb-2">See it in action</h2>
          <p className="text-sm text-[#778873] text-center mb-8">Swipe to explore</p>
        </FadeIn>
        <ScreenshotCarousel />
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 pb-20 max-w-md mx-auto">
        <FadeIn>
          <h2 className="text-lg font-bold text-[#1A1A1A] text-center mb-10">How it works</h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-[#D2DCB6]" />

          <div className="space-y-6">
            {[
              { step: "1", title: "Open in World App", desc: "Scan QR or tap the link to launch Masil inside World App." },
              { step: "2", title: "Verify with World ID", desc: "One tap to prove you're human. No passwords, no sign-ups." },
              { step: "3", title: "Visit & review", desc: "Go to a spot. If you're within 50m, write a GPS-verified review." },
              { step: "4", title: "Build trust", desc: "Earn trust as others find your reviews helpful." },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 80}>
                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-[#B87C4C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">
                    {item.step}
                  </div>
                  <div className="pt-0.5">
                    <h3 className="font-semibold text-[#1A1A1A] text-[15px] mb-0.5">{item.title}</h3>
                    <p className="text-sm text-[#778873] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-24 max-w-md mx-auto">
        <FadeIn>
          <h2 className="text-lg font-bold text-[#1A1A1A] text-center mb-8">FAQ</h2>
        </FadeIn>
        <div className="space-y-3">
          {[
            {
              q: "What is Masil?",
              a: "A neighborhood review app for foreigners in Korea. Every review is GPS-verified and written by a real, World ID-authenticated human.",
            },
            {
              q: "Why do I need World App?",
              a: "World App provides proof-of-personhood via World ID — ensuring every reviewer is a unique, verified human. No fake reviews, no bots.",
            },
            {
              q: "How does GPS verification work?",
              a: "You must be within 50 meters of a place to write a review. This guarantees reviews come from people who actually visited.",
            },
            {
              q: "What areas does it cover?",
              a: "Currently focused on Jongno-gu — Insadong, Bukchon, and Gwanghwamun. Expanding soon.",
            },
            {
              q: "Is it free?",
              a: "Orb-verified World ID users get full access for free. Non-verified users can pay $0.10 USDC for read-only access.",
            },
          ].map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 50}>
              <FaqItem question={faq.q} answer={faq.a} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-10 text-center space-y-3">
        <a
          href="https://github.com/moyedx3/Masil"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#778873] hover:text-[#1A1A1A] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View on GitHub
        </a>
        <p className="text-[11px] text-[#A8BBA3]">Built for World Build Korea 2026</p>
      </footer>

    </main>
  );
}

/* ── Value Card ── */
function ValueCard({ icon, title, desc }: { icon: "gps" | "id" | "trust"; title: string; desc: string }) {
  const icons = {
    gps: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B87C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    id: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B87C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    trust: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B87C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#E8E4D9]">
      <div className="w-11 h-11 rounded-xl bg-[#B87C4C]/[0.08] flex items-center justify-center mx-auto mb-2.5">
        {icons[icon]}
      </div>
      <h3 className="font-semibold text-[13px] text-[#1A1A1A] mb-0.5">{title}</h3>
      <p className="text-[11px] text-[#778873] leading-snug">{desc}</p>
    </div>
  );
}

/* ── Screenshot Carousel ── */
function ScreenshotCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const screenshots = [
    { src: "/screenshots/screenshot-reviews.png", label: "Browse real reviews" },
    { src: "/screenshots/screenshot-write.png", label: "Write & unlock access" },
    { src: "/screenshots/screenshot-trust.png", label: "Build your trust score" },
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = Math.min(el.offsetWidth * 0.72, 320) + 16;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.max(0, Math.min(index, screenshots.length - 1)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [screenshots.length]);

  // Lock body scroll & handle Escape when lightbox is open
  useEffect(() => {
    if (expanded === null) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [expanded]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-6 justify-center"
      >
        {screenshots.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setExpanded(i)}
            className="flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-lg border border-[#E8E4D9] bg-white w-[72vw] max-w-[280px] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            <Image
              src={s.src}
              alt={s.label}
              width={640}
              height={640}
              className="w-full h-auto"
            />
          </button>
        ))}
      </div>

      {/* Dots + label */}
      <div className="flex flex-col items-center mt-4 gap-2">
        <div className="flex gap-1.5">
          {screenshots.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-[#B87C4C]" : "w-1.5 bg-[#D2DCB6]"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#778873] font-medium">{screenshots[activeIndex].label}</p>
      </div>

      {/* Lightbox */}
      {expanded !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpanded(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={screenshots[expanded].src}
              alt={screenshots[expanded].label}
              width={1000}
              height={1000}
              className="w-full h-auto"
            />
            {/* Close button */}
            <button
              onClick={() => setExpanded(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors"
            >
              ✕
            </button>
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 pt-8">
              <p className="text-white text-sm font-medium">{screenshots[expanded].label}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── FAQ Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-[#E8E4D9] transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#1A1A1A] text-[15px]">{question}</h3>
        <span
          className={`text-[#B87C4C] text-lg flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-40 mt-2 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-sm text-[#778873] leading-relaxed">{answer}</p>
      </div>
    </button>
  );
}

/* ── Fade In on Scroll ── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

