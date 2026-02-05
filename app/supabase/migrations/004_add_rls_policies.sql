-- Migration: Add RLS policies to places and reviews tables
-- Created: 2026-02-06

-- Places table RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Places are publicly readable" ON places;
CREATE POLICY "Places are publicly readable"
  ON places FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service can manage places" ON places;
CREATE POLICY "Service can manage places"
  ON places FOR ALL
  WITH CHECK (true);

-- Reviews table RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service can manage reviews" ON reviews;
CREATE POLICY "Service can manage reviews"
  ON reviews FOR ALL
  WITH CHECK (true);
