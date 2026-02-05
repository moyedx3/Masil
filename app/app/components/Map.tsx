"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place, CATEGORIES, CategoryKey } from "@/lib/db";

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Map configuration
const MAP_CENTER: [number, number] = [126.9857, 37.5742]; // Insadong, Jongno-gu [lng, lat]
const MAP_ZOOM = 14;

interface MapProps {
  places: Place[];
  onPlaceSelect?: (placeId: string) => void;
}

export default function Map({ places, onPlaceSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when map is loaded and places change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Add markers for each place
    places.forEach((place) => {
      const category = place.category as CategoryKey;
      const categoryInfo = CATEGORIES[category] || CATEGORIES.other;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "emoji-marker";
      el.style.cssText = `
        font-size: 28px;
        cursor: pointer;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        transition: transform 0.2s ease;
      `;
      el.textContent = categoryInfo.emoji;

      // Hover effect
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      // Click handler - emit place selection
      el.addEventListener("click", () => {
        if (onPlaceSelect) {
          onPlaceSelect(place.id);
        }
      });

      // Create marker without popup
      new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map.current!);
    });
  }, [places, mapLoaded, onPlaceSelect]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: "100vh" }}
    />
  );
}
