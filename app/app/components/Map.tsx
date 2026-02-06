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

      // Create custom SVG marker element
      const el = document.createElement("div");
      el.className = "category-marker";
      el.setAttribute("aria-label", `${place.name} - ${categoryInfo.label}`);
      el.style.cssText = `
        width: 36px;
        height: 36px;
        cursor: pointer;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      `;
      el.innerHTML = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="16.25" fill="${categoryInfo.color}" stroke="white" stroke-width="2.5"/><g transform="translate(9,9) scale(${18 / 256})"><path d="${categoryInfo.iconPath}" fill="white"/></g></svg>`;

      // Click handler - emit place selection
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onPlaceSelect) {
          onPlaceSelect(place.id);
        }
      });

      // Create marker with explicit center anchor
      new mapboxgl.Marker({ element: el, anchor: "center" })
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
