/*
  # HashBurst Blockchain Records Schema

  1. New Tables
    - `blockchain_records`
      - `id` (uuid, primary key)
      - `record_type` (text) - Type: 'file', 'event', 'data', 'contract'
      - `title` (text) - Record title/name
      - `description` (text) - Record description
      - `ipfs_hash` (text) - IPFS CID if file uploaded
      - `blockchain_hash` (text) - Transaction hash on HashBurst
      - `metadata` (jsonb) - Additional metadata
      - `file_size` (bigint) - File size in bytes (if applicable)
      - `file_type` (text) - MIME type (if applicable)
      - `status` (text) - Status: 'pending', 'confirmed', 'failed'
      - `created_by` (uuid) - User who created record
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `network_nodes`
      - `id` (uuid, primary key)
      - `node_name` (text) - Node identifier
      - `node_type` (text) - Type: 'virtual', 'ipfs', 'validator'
      - `endpoint` (text) - Node URL/endpoint
      - `status` (text) - Status: 'online', 'offline', 'syncing'
      - `last_block` (bigint) - Last block number
      - `last_ping` (timestamptz) - Last health check
      - `metadata` (jsonb) - Additional node info
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `smart_contracts`
      - `id` (uuid, primary key)
      - `contract_name` (text) - Contract name
      - `contract_address` (text) - Blockchain address
      - `contract_type` (text) - Type: 'HBT-20', 'HBT-721', 'custom'
      - `abi` (jsonb) - Contract ABI
      - `bytecode` (text) - Contract bytecode
      - `deployed_by` (uuid) - Deployer user ID
      - `deployed_at` (timestamptz)
      - `status` (text) - Status: 'active', 'deprecated'
      - `metadata` (jsonb) - Additional contract info
      - `created_at` (timestamptz)

    - `blockchain_events`
      - `id` (uuid, primary key)
      - `event_type` (text) - Event type: 'transfer', 'mint', 'swap', 'stake'
      - `event_name` (text) - Event name
      - `transaction_hash` (text) - Transaction hash
      - `block_number` (bigint) - Block number
      - `contract_address` (text) - Contract address
      - `event_data` (jsonb) - Event parameters
      - `timestamp` (timestamptz) - Event timestamp
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their records
    - Add policies for public read access to confirmed records
*/

-- Create blockchain_records table
CREATE TABLE IF NOT EXISTS blockchain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL CHECK (record_type IN ('file', 'event', 'data', 'contract')),
  title text NOT NULL,
  description text DEFAULT '',
  ipfs_hash text,
  blockchain_hash text,
  metadata jsonb DEFAULT '{}',
  file_size bigint,
  file_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create network_nodes table
CREATE TABLE IF NOT EXISTS network_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_name text NOT NULL UNIQUE,
  node_type text NOT NULL CHECK (node_type IN ('virtual', 'ipfs', 'validator')),
  endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'syncing')),
  last_block bigint DEFAULT 0,
  last_ping timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create smart_contracts table
CREATE TABLE IF NOT EXISTS smart_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name text NOT NULL,
  contract_address text NOT NULL UNIQUE,
  contract_type text NOT NULL CHECK (contract_type IN ('HBT-20', 'HBT-721', 'custom')),
  abi jsonb DEFAULT '[]',
  bytecode text,
  deployed_by uuid,
  deployed_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create blockchain_events table
CREATE TABLE IF NOT EXISTS blockchain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_name text NOT NULL,
  transaction_hash text NOT NULL,
  block_number bigint NOT NULL,
  contract_address text,
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_records_type ON blockchain_records(record_type);
CREATE INDEX IF NOT EXISTS idx_records_status ON blockchain_records(status);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON blockchain_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_blockchain_hash ON blockchain_records(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_records_ipfs_hash ON blockchain_records(ipfs_hash);

CREATE INDEX IF NOT EXISTS idx_nodes_status ON network_nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON network_nodes(node_type);

CREATE INDEX IF NOT EXISTS idx_contracts_address ON smart_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON smart_contracts(contract_type);

CREATE INDEX IF NOT EXISTS idx_events_type ON blockchain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_block ON blockchain_events(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON blockchain_events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON blockchain_events(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- Policies for blockchain_records
CREATE POLICY "Anyone can view confirmed records"
  ON blockchain_records FOR SELECT
  USING (status = 'confirmed');

CREATE POLICY "Users can view their own records"
  ON blockchain_records FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create records"
  ON blockchain_records FOR INSERT
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users can update their own records"
  ON blockchain_records FOR UPDATE
  USING (created_by = auth.uid() OR created_by IS NULL)
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- Policies for network_nodes (public read, no write for users)
CREATE POLICY "Anyone can view network nodes"
  ON network_nodes FOR SELECT
  USING (true);

-- Policies for smart_contracts (public read)
CREATE POLICY "Anyone can view contracts"
  ON smart_contracts FOR SELECT
  USING (true);

CREATE POLICY "Users can deploy contracts"
  ON smart_contracts FOR INSERT
  WITH CHECK (deployed_by = auth.uid() OR deployed_by IS NULL);

-- Policies for blockchain_events (public read)
CREATE POLICY "Anyone can view blockchain events"
  ON blockchain_events FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_blockchain_records_updated_at
  BEFORE UPDATE ON blockchain_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_network_nodes_updated_at
  BEFORE UPDATE ON network_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();