"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Place, Review } from "@/lib/db";
import BottomSheet from "@/app/components/BottomSheet";
import PlaceDetail from "@/app/components/PlaceDetail";
import AddReviewModal from "@/app/components/AddReviewModal";

// Dynamically import Map to avoid SSR issues with Mapbox
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

type Status = "loading" | "ready" | "error";

interface PlaceWithReviews extends Place {
  reviews: Review[];
}

export default function HomePage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Bottom sheet state
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithReviews | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Add review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
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
      // Still show the sheet but with error state
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

  // Open add review modal
  const handleAddReview = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

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
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-500 mb-4">{errorMsg}</p>
        <button
          onClick={() => {
            setStatus("loading");
            fetchPlaces();
          }}
          className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full"
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
          <div className="bg-[#22C55E] text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
            <span>✓</span>
            <span>Review posted!</span>
          </div>
        </div>
      )}

      {/* Map takes full screen */}
      <div className="absolute inset-0">
        <Map places={places} onPlaceSelect={handlePlaceSelect} />
      </div>

      {/* Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-lg font-bold text-[#1A1A1A]">Masil</span>
            <span className="text-sm text-gray-500">마실</span>
            <div className="w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center ml-1">
              <span className="text-xs text-white">✓</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-white rounded-full px-4 py-2 shadow-lg text-gray-600 text-sm"
          >
            {isSigningOut ? "..." : "Sign out"}
          </button>
        </div>
      </header>

      {/* Places count indicator */}
      {status === "ready" && !isBottomSheetOpen && (
        <div className="absolute bottom-6 left-4 z-10">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg text-sm text-gray-600">
            {places.length} places
          </div>
        </div>
      )}

      {/* Bottom Sheet with Place Details */}
      <BottomSheet isOpen={isBottomSheetOpen} onClose={handleBottomSheetClose}>
        {isLoadingPlace ? (
          <PlaceDetail
            place={{
              id: "",
              name: "Loading...",
              name_korean: null,
              latitude: 0,
              longitude: 0,
              category: "other",
              google_place_id: null,
              address: null,
              created_at: "",
            }}
            reviews={[]}
            isLoading={true}
          />
        ) : selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            reviews={selectedPlace.reviews}
            onAddReview={handleAddReview}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-gray-500">Failed to load place details</p>
            <button
              onClick={() => selectedPlaceId && handlePlaceSelect(selectedPlaceId)}
              className="mt-4 text-[#FF6B35] font-medium"
            >
              Try again
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Add Review Modal */}
      {selectedPlace && (
        <AddReviewModal
          place={selectedPlace}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </main>
  );
}
