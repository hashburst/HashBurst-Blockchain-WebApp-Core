/*
  # Wallet, Node, and Federation Schema

  1. New Tables
    - `user_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User identifier
      - `wallet_address` (text, unique) - Public wallet address
      - `public_key` (text) - Public key
      - `encrypted_private_key` (text) - Encrypted private key
      - `wallet_name` (text) - User-friendly name
      - `balance` (numeric) - Wallet balance
      - `is_primary` (boolean) - Primary wallet flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `network_nodes`
      - Add columns for federation capabilities
      - `node_id` (text) - Unique node identifier
      - `ip_address` (text) - Node IP address
      - `port` (integer) - Node port
      - `public_key` (text) - Node public key
      - `is_federated` (boolean) - Federation status
      - `compute_contribution` (numeric) - Compute power contributed
      - `storage_contribution` (bigint) - Storage space in bytes
      - `uptime_percentage` (numeric) - Node uptime
      - `reputation_score` (integer) - Node reputation
      - `rewards_earned` (numeric) - Total rewards earned
    
    - `federated_resources`
      - `id` (uuid, primary key)
      - `node_id` (uuid) - Reference to network_nodes
      - `user_id` (uuid) - Resource owner
      - `resource_type` (text) - Type: 'compute', 'storage', 'bandwidth'
      - `capacity` (numeric) - Total capacity
      - `used` (numeric) - Used capacity
      - `available` (numeric) - Available capacity
      - `price_per_unit` (numeric) - Price for resource
      - `status` (text) - Status: 'active', 'inactive', 'maintenance'
      - `metadata` (jsonb) - Additional resource info
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ipfs_nodes`
      - `id` (uuid, primary key)
      - `node_id` (text, unique) - IPFS node ID
      - `peer_id` (text) - IPFS peer ID
      - `multiaddress` (text) - IPFS multiaddress
      - `owner_id` (uuid) - Node owner
      - `storage_capacity` (bigint) - Total storage in bytes
      - `storage_used` (bigint) - Used storage
      - `pinned_files` (integer) - Number of pinned files
      - `bandwidth_up` (bigint) - Upload bandwidth
      - `bandwidth_down` (bigint) - Download bandwidth
      - `is_online` (boolean) - Online status
      - `last_seen` (timestamptz) - Last activity
      - `rewards_earned` (numeric) - Rewards from hosting
      - `created_at` (timestamptz)
    
    - `node_transactions`
      - `id` (uuid, primary key)
      - `transaction_hash` (text, unique) - Blockchain tx hash
      - `from_wallet` (text) - Sender wallet
      - `to_wallet` (text) - Receiver wallet
      - `amount` (numeric) - Transaction amount
      - `transaction_type` (text) - Type: 'reward', 'payment', 'stake'
      - `node_id` (uuid) - Associated node
      - `status` (text) - Status: 'pending', 'confirmed', 'failed'
      - `block_number` (bigint) - Block number
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)
    
    - `p2p_connections`
      - `id` (uuid, primary key)
      - `source_node_id` (uuid) - Source node
      - `target_node_id` (uuid) - Target node
      - `connection_type` (text) - Type: 'blockchain', 'ipfs', 'hybrid'
      - `latency` (integer) - Connection latency in ms
      - `bandwidth` (bigint) - Available bandwidth
      - `is_active` (boolean) - Connection status
      - `last_ping` (timestamptz) - Last ping time
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Users can manage their own wallets and nodes
    - Public read for network statistics
    - Restricted write access for critical operations
*/

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address text NOT NULL UNIQUE,
  public_key text NOT NULL,
  encrypted_private_key text NOT NULL,
  wallet_name text DEFAULT 'My Wallet',
  balance numeric DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to network_nodes if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'node_id') THEN
    ALTER TABLE network_nodes ADD COLUMN node_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'ip_address') THEN
    ALTER TABLE network_nodes ADD COLUMN ip_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'port') THEN
    ALTER TABLE network_nodes ADD COLUMN port integer DEFAULT 8002;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'public_key') THEN
    ALTER TABLE network_nodes ADD COLUMN public_key text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'is_federated') THEN
    ALTER TABLE network_nodes ADD COLUMN is_federated boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'compute_contribution') THEN
    ALTER TABLE network_nodes ADD COLUMN compute_contribution numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'storage_contribution') THEN
    ALTER TABLE network_nodes ADD COLUMN storage_contribution bigint DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'uptime_percentage') THEN
    ALTER TABLE network_nodes ADD COLUMN uptime_percentage numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'reputation_score') THEN
    ALTER TABLE network_nodes ADD COLUMN reputation_score integer DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_nodes' AND column_name = 'rewards_earned') THEN
    ALTER TABLE network_nodes ADD COLUMN rewards_earned numeric DEFAULT 0;
  END IF;
END $$;

-- Create federated_resources table
CREATE TABLE IF NOT EXISTS federated_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES network_nodes(id),
  user_id uuid,
  resource_type text NOT NULL CHECK (resource_type IN ('compute', 'storage', 'bandwidth')),
  capacity numeric NOT NULL DEFAULT 0,
  used numeric DEFAULT 0,
  available numeric DEFAULT 0,
  price_per_unit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ipfs_nodes table
CREATE TABLE IF NOT EXISTS ipfs_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL UNIQUE,
  peer_id text NOT NULL,
  multiaddress text NOT NULL,
  owner_id uuid,
  storage_capacity bigint DEFAULT 0,
  storage_used bigint DEFAULT 0,
  pinned_files integer DEFAULT 0,
  bandwidth_up bigint DEFAULT 0,
  bandwidth_down bigint DEFAULT 0,
  is_online boolean DEFAULT false,
  last_seen timestamptz,
  rewards_earned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create node_transactions table
CREATE TABLE IF NOT EXISTS node_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash text NOT NULL UNIQUE,
  from_wallet text NOT NULL,
  to_wallet text NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('reward', 'payment', 'stake', 'transfer')),
  node_id uuid REFERENCES network_nodes(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number bigint,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create p2p_connections table
CREATE TABLE IF NOT EXISTS p2p_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id uuid REFERENCES network_nodes(id),
  target_node_id uuid REFERENCES network_nodes(id),
  connection_type text NOT NULL CHECK (connection_type IN ('blockchain', 'ipfs', 'hybrid')),
  latency integer DEFAULT 0,
  bandwidth bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  last_ping timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nodes_node_id ON network_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_federated ON network_nodes(is_federated);
CREATE INDEX IF NOT EXISTS idx_resources_node_id ON federated_resources(node_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON federated_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON federated_resources(status);
CREATE INDEX IF NOT EXISTS idx_ipfs_nodes_peer_id ON ipfs_nodes(peer_id);
CREATE INDEX IF NOT EXISTS idx_ipfs_nodes_online ON ipfs_nodes(is_online);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON node_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON node_transactions(from_wallet, to_wallet);
CREATE INDEX IF NOT EXISTS idx_p2p_active ON p2p_connections(is_active);

-- Enable Row Level Security
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE federated_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipfs_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_connections ENABLE ROW LEVEL SECURITY;

-- Policies for user_wallets
CREATE POLICY "Users can view their own wallets"
  ON user_wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets"
  ON user_wallets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for federated_resources
CREATE POLICY "Anyone can view active resources"
  ON federated_resources FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage their own resources"
  ON federated_resources FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for ipfs_nodes
CREATE POLICY "Anyone can view online IPFS nodes"
  ON ipfs_nodes FOR SELECT
  USING (is_online = true);

CREATE POLICY "Owners can manage their IPFS nodes"
  ON ipfs_nodes FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policies for node_transactions
CREATE POLICY "Anyone can view confirmed transactions"
  ON node_transactions FOR SELECT
  USING (status = 'confirmed');

CREATE POLICY "Users can view their own transactions"
  ON node_transactions FOR SELECT
  USING (from_wallet IN (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid())
         OR to_wallet IN (SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()));

-- Policies for p2p_connections
CREATE POLICY "Anyone can view active connections"
  ON p2p_connections FOR SELECT
  USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_federated_resources_updated_at
  BEFORE UPDATE ON federated_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();