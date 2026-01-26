/*
  # External Wallets Schema

  1. New Tables
    - `external_wallets`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - User who owns this external wallet
      - `wallet_type` (text) - Type of wallet (metamask, trust, tronlink, ledger)
      - `wallet_address` (text) - Blockchain address
      - `wallet_name` (text) - Friendly name for the wallet
      - `chain_id` (integer) - Chain ID for EVM wallets
      - `network` (text) - Network name
      - `balance` (numeric) - Current balance
      - `is_connected` (boolean) - Connection status
      - `last_connected` (timestamptz) - Last connection time
      - `metadata` (jsonb) - Additional wallet data (derivation paths, etc.)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on external_wallets table
    - Users can only access their own external wallets
    - Unique constraint on user_id + wallet_address

  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on wallet_type
    - Add index on wallet_address
*/

-- Create external_wallets table
CREATE TABLE IF NOT EXISTS external_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_type text NOT NULL,
  wallet_address text NOT NULL,
  wallet_name text NOT NULL,
  chain_id integer,
  network text,
  balance numeric DEFAULT 0,
  is_connected boolean DEFAULT true,
  last_connected timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_address)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_wallets_user_id ON external_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_external_wallets_type ON external_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_external_wallets_address ON external_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_external_wallets_connected ON external_wallets(is_connected);

-- Enable RLS
ALTER TABLE external_wallets ENABLE ROW LEVEL SECURITY;

-- Policies for external_wallets
CREATE POLICY "Users can view their own external wallets"
  ON external_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own external wallets"
  ON external_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own external wallets"
  ON external_wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own external wallets"
  ON external_wallets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_wallets_updated_at
  BEFORE UPDATE ON external_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();