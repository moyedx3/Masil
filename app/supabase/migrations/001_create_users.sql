-- Create users table for World ID verified users
CREATE TABLE IF NOT EXISTS users (
  nullifier_hash VARCHAR(66) PRIMARY KEY,
  wallet_address VARCHAR(42),
  trust_score INTEGER DEFAULT 50,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT
  USING (true);

-- Policy: Allow service role to insert/update
CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
