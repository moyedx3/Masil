-- Migration: Create places table
-- Created: 2026-02-06

CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_korean VARCHAR(255),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category VARCHAR(50) NOT NULL,
  google_place_id VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);

-- Unique constraint on google_place_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_google_place_id ON places(google_place_id) WHERE google_place_id IS NOT NULL;
