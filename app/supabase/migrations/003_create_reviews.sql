-- Migration: Create reviews table
-- Created: 2026-02-06

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_nullifier VARCHAR(66) REFERENCES users(nullifier_hash),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  -- Fields for imported reviews
  source VARCHAR(20) DEFAULT 'user',
  original_platform VARCHAR(50),
  original_author VARCHAR(100),
  imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching reviews by place
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);

-- Index for filtering by source (user vs imported)
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
