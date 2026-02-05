"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Snap points in viewport height percentage
const SNAP_POINTS = {
  closed: 0,
  peek: 35, // Show place name and basic info
  half: 55, // Show some reviews
  full: 90, // Full screen with all reviews
};

export default function BottomSheet({
  isOpen,
  onClose,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(SNAP_POINTS.closed);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Open to peek position when isOpen changes to true
  useEffect(() => {
    if (isOpen) {
      setHeight(SNAP_POINTS.peek);
    } else {
      setHeight(SNAP_POINTS.closed);
    }
  }, [isOpen]);

  // Find nearest snap point
  const snapToNearest = useCallback((currentHeight: number, velocity: number) => {
    const snapValues = [
      SNAP_POINTS.closed,
      SNAP_POINTS.peek,
      SNAP_POINTS.half,
      SNAP_POINTS.full,
    ];

    // If swiping down fast, close or go to lower snap
    if (velocity > 0.5 && currentHeight < SNAP_POINTS.half) {
      setHeight(SNAP_POINTS.closed);
      setTimeout(onClose, 150);
      return;
    }

    // If swiping up fast, go to higher snap
    if (velocity < -0.5) {
      const nextSnap = snapValues.find((snap) => snap > currentHeight);
      if (nextSnap) {
        setHeight(nextSnap);
        return;
      }
    }

    // Otherwise snap to nearest
    let nearest = snapValues[0];
    let minDist = Math.abs(currentHeight - nearest);

    for (const snap of snapValues) {
      const dist = Math.abs(currentHeight - snap);
      if (dist < minDist) {
        minDist = dist;
        nearest = snap;
      }
    }

    if (nearest === SNAP_POINTS.closed) {
      setHeight(SNAP_POINTS.closed);
      setTimeout(onClose, 150);
    } else {
      setHeight(nearest);
    }
  }, [onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startHeight.current = height;
  }, [height]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaY = startY.current - e.touches[0].clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(0, Math.min(95, startHeight.current + deltaPercent));

    setHeight(newHeight);
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const endY = e.changedTouches[0].clientY;
    const velocity = (startY.current - endY) / window.innerHeight * -1;

    snapToNearest(height, velocity);
  }, [isDragging, height, snapToNearest]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = height;
    e.preventDefault();
  }, [height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY.current - e.clientY;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = Math.max(0, Math.min(95, startHeight.current + deltaPercent));

      setHeight(newHeight);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      setIsDragging(false);

      const velocity = (startY.current - e.clientY) / window.innerHeight * -1;
      snapToNearest(height, velocity);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, height, snapToNearest]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    setHeight(SNAP_POINTS.closed);
    setTimeout(onClose, 150);
  };

  if (!isOpen && height === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          height > SNAP_POINTS.peek ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
        style={{
          height: `${height}vh`,
          transition: isDragging ? "none" : "height 0.3s ease-out",
          touchAction: "none",
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-full py-4 cursor-grab active:cursor-grabbing flex justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto px-4 pb-8"
          style={{ height: `calc(${height}vh - 56px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
