/*
  # Smart Contracts and Name Service Schema

  1. New Tables
    - `deployed_contracts`
      - `id` (uuid, primary key) - Unique identifier for each deployed contract
      - `wallet_id` (uuid, foreign key) - Reference to the wallet that deployed the contract
      - `contract_name` (text) - Name of the smart contract
      - `contract_type` (text) - Type of contract (token, nft, generic, custom)
      - `contract_address` (text) - Deployed contract address on blockchain
      - `source_code` (text) - Solidity source code
      - `abi` (jsonb) - Contract ABI (Application Binary Interface)
      - `bytecode` (text) - Compiled bytecode
      - `constructor_args` (jsonb) - Constructor arguments used during deployment
      - `deployment_tx` (text) - Transaction hash of deployment
      - `network` (text) - Network where contract is deployed (mainnet, testnet, hashburst)
      - `status` (text) - Deployment status (pending, deployed, failed)
      - `gas_used` (bigint) - Gas used for deployment
      - `deployed_at` (timestamptz) - Timestamp of deployment
      - `created_at` (timestamptz) - Record creation timestamp

    - `name_service_records`
      - `id` (uuid, primary key) - Unique identifier for each name record
      - `wallet_id` (uuid, foreign key) - Reference to the wallet that owns this name
      - `name` (text, unique) - The name (e.g., "alice.eth" or "alice.hbc")
      - `domain` (text) - Domain extension (eth, hbc, etc.)
      - `address` (text) - Primary blockchain address
      - `addresses` (jsonb) - Multi-chain addresses (BTC, ETH, etc.)
      - `metadata` (jsonb) - Additional metadata (avatar, description, social links, etc.)
      - `resolver` (text) - Resolver contract address
      - `expires_at` (timestamptz) - Expiration date for the name registration
      - `is_primary` (boolean) - Whether this is the primary name for the wallet
      - `status` (text) - Status (active, expired, transferred)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `contract_interactions`
      - `id` (uuid, primary key) - Unique identifier for each interaction
      - `wallet_id` (uuid, foreign key) - Reference to the wallet making the interaction
      - `contract_id` (uuid, foreign key) - Reference to the deployed contract
      - `function_name` (text) - Name of the function called
      - `parameters` (jsonb) - Function parameters
      - `transaction_hash` (text) - Transaction hash
      - `gas_used` (bigint) - Gas used
      - `status` (text) - Status (pending, success, failed)
      - `result` (jsonb) - Function execution result
      - `created_at` (timestamptz) - Interaction timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own contracts and names
    - Add policies for public read access to name service records (for resolution)

  3. Indexes
    - Add indexes on wallet_id for efficient queries
    - Add index on name for fast name lookups
    - Add index on contract_address for contract queries
*/

-- Create deployed_contracts table
CREATE TABLE IF NOT EXISTS deployed_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES user_wallets(id) ON DELETE CASCADE,
  contract_name text NOT NULL,
  contract_type text NOT NULL DEFAULT 'generic',
  contract_address text,
  source_code text NOT NULL,
  abi jsonb,
  bytecode text,
  constructor_args jsonb DEFAULT '[]'::jsonb,
  deployment_tx text,
  network text NOT NULL DEFAULT 'hashburst',
  status text NOT NULL DEFAULT 'pending',
  gas_used bigint,
  deployed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create name_service_records table
CREATE TABLE IF NOT EXISTS name_service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES user_wallets(id) ON DELETE CASCADE,
  name text NOT NULL UNIQUE,
  domain text NOT NULL,
  address text NOT NULL,
  addresses jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolver text,
  expires_at timestamptz,
  is_primary boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contract_interactions table
CREATE TABLE IF NOT EXISTS contract_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES user_wallets(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  transaction_hash text,
  gas_used bigint,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_wallet_id ON deployed_contracts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_address ON deployed_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_network ON deployed_contracts(network);
CREATE INDEX IF NOT EXISTS idx_name_service_name ON name_service_records(name);
CREATE INDEX IF NOT EXISTS idx_name_service_wallet_id ON name_service_records(wallet_id);
CREATE INDEX IF NOT EXISTS idx_name_service_address ON name_service_records(address);
CREATE INDEX IF NOT EXISTS idx_contract_interactions_wallet_id ON contract_interactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_contract_interactions_contract_id ON contract_interactions(contract_id);

-- Enable RLS
ALTER TABLE deployed_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for deployed_contracts
CREATE POLICY "Users can view their own contracts"
  ON deployed_contracts FOR SELECT
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own contracts"
  ON deployed_contracts FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own contracts"
  ON deployed_contracts FOR UPDATE
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()))
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own contracts"
  ON deployed_contracts FOR DELETE
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

-- Policies for name_service_records
CREATE POLICY "Anyone can view active name records"
  ON name_service_records FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can insert their own name records"
  ON name_service_records FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own name records"
  ON name_service_records FOR UPDATE
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()))
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own name records"
  ON name_service_records FOR DELETE
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

-- Policies for contract_interactions
CREATE POLICY "Users can view their own interactions"
  ON contract_interactions FOR SELECT
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own interactions"
  ON contract_interactions FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own interactions"
  ON contract_interactions FOR UPDATE
  TO authenticated
  USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()))
  WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for name_service_records
DROP TRIGGER IF EXISTS update_name_service_records_updated_at ON name_service_records;
CREATE TRIGGER update_name_service_records_updated_at
  BEFORE UPDATE ON name_service_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();