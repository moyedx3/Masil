-- Add access_tier column to users table
-- 'orb' = World ID verified (full access), 'paid' = $1 USDC (view-only)
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'orb'
  CHECK (access_tier IN ('orb', 'paid'));
