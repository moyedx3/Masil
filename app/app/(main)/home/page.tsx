"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Place, Review, HelpfulnessVote, AccessTier, CATEGORIES, CategoryKey } from "@/lib/db";
import BottomSheet from "@/app/components/BottomSheet";
import PlaceDetail from "@/app/components/PlaceDetail";
import { useNav } from "@/app/components/NavContext";
const AddReviewModal = dynamic(() => import("@/app/components/AddReviewModal"), {
  ssr: false,
});
import CategoryFilterBar from "@/app/components/CategoryFilterBar";

type AuthTier = AccessTier | "anonymous";

const LOADING_PLACE: Place = {
  id: "",
  name: "Loading...",
  name_korean: null,
  latitude: 0,
  longitude: 0,
  category: "other",
  google_place_id: null,
  address: null,
  created_at: "",
};
const EMPTY_REVIEWS: Review[] = [];

// Dynamically import Map to avoid SSR issues with Mapbox
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#F7F4EA]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#D2DCB6] border-t-[#B87C4C] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#778873]">Loading map...</p>
      </div>
    </div>
  ),
});

type Status = "loading" | "ready" | "error";

interface PlaceWithReviews extends Place {
  reviews: Review[];
  userVotes: HelpfulnessVote[];
  currentUserNullifier: string | null;
}

export default function HomePage() {
  const { setHideNav } = useNav();
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth tier: anonymous until checked
  const [authTier, setAuthTier] = useState<AuthTier>("anonymous");

  // Bottom sheet state
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithReviews | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Add review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Handle bottom sheet snap changes to hide/show nav
  const handleSnapChange = useCallback(
    (snap: "closed" | "peek" | "half" | "full") => {
      setHideNav(snap === "full");
    },
    [setHideNav]
  );

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  const filteredPlaces = useMemo(() => {
    if (!selectedCategory) return places;
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  const handleCategorySelect = useCallback((category: CategoryKey) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthTier(data.access_tier || "orb");
          return;
        }
      }
    } catch {
      // Not authenticated — stay anonymous
    }
    setAuthTier("anonymous");
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch("/api/places");
      if (!res.ok) {
        throw new Error("Failed to fetch places");
      }
      const data = await res.json();
      setPlaces(data);
      setStatus("ready");
    } catch (error) {
      console.error("Error fetching places:", error);
      setErrorMsg("Failed to load places. Please try again.");
      setStatus("error");
    }
  };

  // Handle place selection from map
  const handlePlaceSelect = useCallback(async (placeId: string) => {
    setSelectedPlaceId(placeId);
    setIsBottomSheetOpen(true);
    setIsLoadingPlace(true);

    try {
      const res = await fetch(`/api/places/${placeId}/reviews`);
      if (!res.ok) {
        throw new Error("Failed to fetch place details");
      }
      const data: PlaceWithReviews = await res.json();
      setSelectedPlace(data);
    } catch (error) {
      console.error("Error fetching place details:", error);
      setSelectedPlace(null);
    } finally {
      setIsLoadingPlace(false);
    }
  }, []);

  // Handle bottom sheet close
  const handleBottomSheetClose = useCallback(() => {
    setIsBottomSheetOpen(false);
    setSelectedPlaceId(null);
    setSelectedPlace(null);
  }, []);

  // Open add review modal (only for orb users)
  const handleAddReview = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

  // Handle request to authenticate (from unlock CTA or write button)
  const handleRequestAuth = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  // Handle auth success (verify or pay)
  const handleAuthSuccess = useCallback((tier: AccessTier) => {
    setAuthTier(tier);
    setShowAuthModal(false);
    // Re-fetch current place to get user votes if now authenticated
    if (selectedPlaceId) {
      handlePlaceSelect(selectedPlaceId);
    }
  }, [selectedPlaceId, handlePlaceSelect]);

  // Handle successful review post
  const handleReviewSuccess = useCallback(() => {
    setIsReviewModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);

    // Refresh reviews for the current place
    if (selectedPlaceId) {
      handlePlaceSelect(selectedPlaceId);
    }
  }, [selectedPlaceId, handlePlaceSelect]);

  // Error state
  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Something went wrong
        </h2>
        <p className="text-[#778873] mb-4">{errorMsg}</p>
        <button
          onClick={() => {
            setStatus("loading");
            fetchPlaces();
          }}
          className="bg-[#B87C4C] text-white px-6 py-3 rounded-full transition-colors hover:opacity-90"
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div className="bg-[#A8BBA3] text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
            <span>✓</span>
            <span>Review posted!</span>
          </div>
        </div>
      )}

      {/* Map takes full screen */}
      <div className="absolute inset-0">
        <Map places={filteredPlaces} onPlaceSelect={handlePlaceSelect} />
      </div>

      {/* Header overlay: logo + category filter on same line */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#F7F4EA] rounded-full px-3 py-2 shadow-lg flex items-center gap-2 shrink-0">
            <div className="bg-[#B87C4C] rounded-lg px-2 py-1">
              <Image src="/logo.png" alt="masil." width={100} height={40} className="h-5 w-auto" />
            </div>
            {authTier === "orb" && (
              <div className="w-5 h-5 bg-[#A8BBA3] rounded-full flex items-center justify-center ml-1">
                <span className="text-xs text-white">✓</span>
              </div>
            )}
            {authTier === "paid" && (
              <div className="w-5 h-5 bg-[#B87C4C] rounded-full flex items-center justify-center ml-1">
                <span className="text-xs text-white">$</span>
              </div>
            )}
          </div>

          {/* Category filter inline */}
          {status === "ready" && (
            <CategoryFilterBar
              places={places}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              inline
            />
          )}
        </div>
      </header>

      {/* Places count indicator */}
      {status === "ready" && !isBottomSheetOpen && (
        <div className="absolute bottom-20 left-4 z-10">
          <div className="bg-[#F7F4EA] rounded-full px-4 py-2 shadow-lg text-sm text-[#778873]">
            {selectedCategory
              ? `${filteredPlaces.length} ${CATEGORIES[selectedCategory].label}${filteredPlaces.length !== 1 ? "s" : ""}`
              : `${filteredPlaces.length} places`}
          </div>
        </div>
      )}

      {/* Bottom Sheet with Place Details */}
      <BottomSheet isOpen={isBottomSheetOpen} onClose={handleBottomSheetClose} onSnapChange={handleSnapChange}>
        {isLoadingPlace ? (
          <PlaceDetail
            place={LOADING_PLACE}
            reviews={EMPTY_REVIEWS}
            isLoading={true}
          />
        ) : selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            reviews={selectedPlace.reviews}
            onAddReview={authTier === "orb" ? handleAddReview : undefined}
            onRequestAuth={handleRequestAuth}
            currentUserNullifier={selectedPlace.currentUserNullifier}
            userVotes={selectedPlace.userVotes}
            authTier={authTier}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-[#778873]">Failed to load place details</p>
            <button
              onClick={() => selectedPlaceId && handlePlaceSelect(selectedPlaceId)}
              className="mt-4 text-[#B87C4C] font-medium"
            >
              Try again
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Add Review Modal (orb-verified only) */}
      {selectedPlace && authTier === "orb" && (
        <AddReviewModal
          place={selectedPlace}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </main>
  );
}

// Inline auth modal component
function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (tier: AccessTier) => void;
}) {
  const [status, setStatus] = useState<"idle" | "verifying" | "paying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async () => {
    setStatus("verifying");
    setErrorMsg("");

    try {
      const { MiniKit, VerificationLevel } = await import("@worldcoin/minikit-js");

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Verification timed out")), 30000);
      });

      const verifyPromise = MiniKit.commandsAsync.verify({
        action: "masilauth",
        verification_level: VerificationLevel.Orb,
      });

      const { finalPayload } = await Promise.race([verifyPromise, timeoutPromise]);

      if (finalPayload.status === "error") {
        setStatus("error");
        setErrorMsg("Verification was cancelled or failed");
        return;
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload,
          action: "masilauth",
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => onSuccess("orb"), 300);
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Backend verification failed");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      if (e instanceof Error && e.message === "Verification timed out") {
        setErrorMsg("Verification timed out. Please try again.");
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    }
  };

  const handlePay = async () => {
    setStatus("paying");
    setErrorMsg("");

    try {
      const { MiniKit, Tokens, tokenToDecimals } = await import("@worldcoin/minikit-js");

      const recipientAddress = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS;
      if (!recipientAddress) {
        setStatus("error");
        setErrorMsg("Payment not configured yet");
        return;
      }

      // Initialize payment reference on backend
      const initRes = await fetch("/api/auth/initiate-payment", { method: "POST" });
      const { id: reference } = await initRes.json();

      const { finalPayload } = await MiniKit.commandsAsync.pay({
        reference,
        to: recipientAddress,
        tokens: [
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(0.1, Tokens.USDC).toString(),
          },
        ],
        description: "Masil - View-only access to reviews",
      });

      if (finalPayload.status === "error") {
        setStatus("error");
        setErrorMsg("Payment was cancelled or failed");
        return;
      }

      // Verify payment on backend
      const res = await fetch("/api/auth/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: (finalPayload as Record<string, unknown>).transaction_id,
          reference,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => onSuccess("paid"), 300);
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Payment verification failed");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("Payment failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={status === "idle" || status === "error" ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-[#F7F4EA] rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={status === "verifying" || status === "paying"}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3E0] text-[#778873] hover:bg-[#D2DCB6] disabled:opacity-50"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-12 h-12 bg-[#F1F3E0] rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#D2DCB6]">
            <span className="text-xl">🔓</span>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">Unlock Reviews</h3>
          <p className="text-sm text-[#778873]">Choose how you want to access reviews</p>
        </div>

        {/* Error */}
        {status === "error" && (
          <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="mb-4 p-3 bg-[#F1F3E0] rounded-xl border border-[#D2DCB6]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 bg-[#A8BBA3] rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-[#778873] text-sm font-medium">Unlocked!</p>
            </div>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={status === "verifying" || status === "paying" || status === "success"}
          className="w-full py-4 px-6 rounded-full font-medium text-white text-base
                     bg-[#B87C4C]
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg mb-3"
        >
          {status === "verifying" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#A1BC98" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" fill="#778873"/>
              </svg>
              Verify with World ID
            </span>
          )}
        </button>

        <p className="text-xs text-[#778873] text-center mb-4">Full access: read, write reviews & vote</p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-[#D2DCB6]" />
          <span className="text-sm text-[#778873]">or</span>
          <div className="flex-1 h-px bg-[#D2DCB6]" />
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={status === "verifying" || status === "paying" || status === "success"}
          className="w-full py-4 px-6 rounded-full font-medium text-[#778873] text-base
                     bg-[#F7F4EA] border-2 border-[#D2DCB6]
                     hover:bg-[#EBD9D1] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 mb-2"
        >
          {status === "paying" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-[#778873] border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "Pay $0.10 USDC to read reviews"
          )}
        </button>

        <p className="text-xs text-[#778873] text-center">View-only access</p>
      </div>
    </div>
  );
}
