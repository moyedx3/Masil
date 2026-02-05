"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place, CATEGORIES, CategoryKey } from "@/lib/db";

// Escape HTML to prevent XSS attacks
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Map configuration
const MAP_CENTER: [number, number] = [126.9857, 37.5742]; // Insadong, Jongno-gu [lng, lat]
const MAP_ZOOM = 14;

interface MapProps {
  places: Place[];
}

export default function Map({ places }: MapProps) {
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

      // Create popup with escaped content to prevent XSS
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "place-popup",
      }).setHTML(`
        <div style="padding: 8px;">
          <strong style="font-size: 14px; color: #1A1A1A;">${escapeHtml(place.name)}</strong>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${categoryInfo.emoji} ${escapeHtml(categoryInfo.label)}
          </div>
        </div>
      `);

      // Create marker
      new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [places, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: "100vh" }}
    />
  );
}
