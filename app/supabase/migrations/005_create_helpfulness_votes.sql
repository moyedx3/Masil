-- Migration: Create helpfulness_votes table
-- Created: 2026-02-06

CREATE TABLE IF NOT EXISTS helpfulness_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_nullifier VARCHAR(66) NOT NULL REFERENCES users(nullifier_hash),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, voter_nullifier)
);

-- Index for fetching votes by review
CREATE INDEX IF NOT EXISTS idx_votes_review_id ON helpfulness_votes(review_id);

-- Index for fetching votes by voter
CREATE INDEX IF NOT EXISTS idx_votes_voter ON helpfulness_votes(voter_nullifier);
