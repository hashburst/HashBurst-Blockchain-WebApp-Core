/*
  # Wrapper Wallets and Multi-Chain Support Schema

  1. New Tables
    - `general_wallets`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - User who owns this general wallet
      - `wallet_id` (uuid, foreign key) - Main HashBurst wallet
      - `name` (text) - Name of the general wallet
      - `description` (text) - Description
      - `total_balance_usd` (numeric) - Total balance across all chains in USD
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `wrapper_wallets`
      - `id` (uuid, primary key) - Unique identifier
      - `general_wallet_id` (uuid, foreign key) - Reference to general wallet
      - `user_wallet_id` (uuid, foreign key) - Reference to HashBurst wallet
      - `chain` (text) - Blockchain type (BTC, BCH, ETC, LTC, ZEC, XMR, DOGE, DASH)
      - `address` (text) - Native blockchain address
      - `public_key` (text) - Public key for the chain
      - `encrypted_private_key` (text) - Encrypted private key
      - `balance` (numeric) - Balance in native currency
      - `balance_usd` (numeric) - Balance in USD
      - `derivation_path` (text) - HD wallet derivation path
      - `is_active` (boolean) - Active status
      - `last_synced` (timestamptz) - Last blockchain sync time
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `native_transactions`
      - `id` (uuid, primary key) - Unique identifier
      - `wrapper_wallet_id` (uuid, foreign key) - Reference to wrapper wallet
      - `transaction_hash` (text) - Native blockchain tx hash
      - `chain` (text) - Blockchain type
      - `from_address` (text) - Sender address
      - `to_address` (text) - Receiver address
      - `amount` (numeric) - Transaction amount in native currency
      - `amount_usd` (numeric) - Amount in USD
      - `fee` (numeric) - Transaction fee
      - `block_number` (bigint) - Block number
      - `confirmations` (integer) - Number of confirmations
      - `status` (text) - Status (pending, confirmed, failed)
      - `transaction_type` (text) - Type (send, receive, internal)
      - `metadata` (jsonb) - Additional transaction data
      - `timestamp` (timestamptz) - Transaction timestamp
      - `created_at` (timestamptz) - Record creation timestamp

    - `chain_configurations`
      - `id` (uuid, primary key) - Unique identifier
      - `chain` (text, unique) - Blockchain identifier
      - `name` (text) - Full name
      - `symbol` (text) - Currency symbol
      - `decimals` (integer) - Number of decimals
      - `explorer_url` (text) - Block explorer URL
      - `rpc_url` (text) - RPC endpoint URL
      - `icon` (text) - Icon/logo identifier
      - `is_testnet` (boolean) - Testnet flag
      - `is_active` (boolean) - Active status
      - `metadata` (jsonb) - Additional chain configuration

  2. Security
    - Enable RLS on all tables
    - Users can only access their own wallets and transactions
    - Public read access to chain configurations

  3. Indexes
    - Add indexes on user_id, wallet references, and chain types
    - Add index on transaction_hash for fast lookups
    - Add index on timestamps for chronological queries
*/

-- Create general_wallets table
CREATE TABLE IF NOT EXISTS general_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_id uuid REFERENCES user_wallets(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_balance_usd numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wrapper_wallets table
CREATE TABLE IF NOT EXISTS wrapper_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  general_wallet_id uuid REFERENCES general_wallets(id) ON DELETE CASCADE,
  user_wallet_id uuid REFERENCES user_wallets(id) ON DELETE CASCADE,
  chain text NOT NULL,
  address text NOT NULL,
  public_key text,
  encrypted_private_key text,
  balance numeric DEFAULT 0,
  balance_usd numeric DEFAULT 0,
  derivation_path text,
  is_active boolean DEFAULT true,
  last_synced timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(general_wallet_id, chain)
);

-- Create native_transactions table
CREATE TABLE IF NOT EXISTS native_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wrapper_wallet_id uuid REFERENCES wrapper_wallets(id) ON DELETE CASCADE,
  transaction_hash text NOT NULL,
  chain text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  amount_usd numeric,
  fee numeric DEFAULT 0,
  block_number bigint,
  confirmations integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  transaction_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(transaction_hash, chain)
);

-- Create chain_configurations table
CREATE TABLE IF NOT EXISTS chain_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain text NOT NULL UNIQUE,
  name text NOT NULL,
  symbol text NOT NULL,
  decimals integer NOT NULL DEFAULT 8,
  explorer_url text,
  rpc_url text,
  icon text,
  is_testnet boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Insert supported chain configurations
INSERT INTO chain_configurations (chain, name, symbol, decimals, explorer_url, icon, is_active) VALUES
  ('BTC', 'Bitcoin', 'BTC', 8, 'https://blockchair.com/bitcoin', '₿', true),
  ('BCH', 'Bitcoin Cash', 'BCH', 8, 'https://blockchair.com/bitcoin-cash', 'BCH', true),
  ('ETC', 'Ethereum Classic', 'ETC', 18, 'https://blockscout.com/etc/mainnet', 'ETC', true),
  ('LTC', 'Litecoin', 'LTC', 8, 'https://blockchair.com/litecoin', 'Ł', true),
  ('ZEC', 'Zcash', 'ZEC', 8, 'https://blockchair.com/zcash', 'ⓩ', true),
  ('XMR', 'Monero', 'XMR', 12, 'https://xmrchain.net', 'ɱ', true),
  ('DOGE', 'Dogecoin', 'DOGE', 8, 'https://blockchair.com/dogecoin', 'Ð', true),
  ('DASH', 'Dash', 'DASH', 8, 'https://blockchair.com/dash', 'Đ', true)
ON CONFLICT (chain) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_general_wallets_user_id ON general_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_general_wallets_wallet_id ON general_wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wrapper_wallets_general_id ON wrapper_wallets(general_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wrapper_wallets_user_wallet_id ON wrapper_wallets(user_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wrapper_wallets_chain ON wrapper_wallets(chain);
CREATE INDEX IF NOT EXISTS idx_wrapper_wallets_address ON wrapper_wallets(address);
CREATE INDEX IF NOT EXISTS idx_native_transactions_wrapper_id ON native_transactions(wrapper_wallet_id);
CREATE INDEX IF NOT EXISTS idx_native_transactions_hash ON native_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_native_transactions_chain ON native_transactions(chain);
CREATE INDEX IF NOT EXISTS idx_native_transactions_timestamp ON native_transactions(timestamp);

-- Enable RLS
ALTER TABLE general_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrapper_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for general_wallets
CREATE POLICY "Users can view their own general wallets"
  ON general_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own general wallets"
  ON general_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own general wallets"
  ON general_wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own general wallets"
  ON general_wallets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for wrapper_wallets
CREATE POLICY "Users can view their own wrapper wallets"
  ON wrapper_wallets FOR SELECT
  TO authenticated
  USING (
    general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
    OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own wrapper wallets"
  ON wrapper_wallets FOR INSERT
  TO authenticated
  WITH CHECK (
    general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
    OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own wrapper wallets"
  ON wrapper_wallets FOR UPDATE
  TO authenticated
  USING (
    general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
    OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  )
  WITH CHECK (
    general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
    OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own wrapper wallets"
  ON wrapper_wallets FOR DELETE
  TO authenticated
  USING (
    general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
    OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  );

-- Policies for native_transactions
CREATE POLICY "Users can view their wrapper wallet transactions"
  ON native_transactions FOR SELECT
  TO authenticated
  USING (
    wrapper_wallet_id IN (
      SELECT id FROM wrapper_wallets WHERE
        general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
        OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create transactions for their wrapper wallets"
  ON native_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    wrapper_wallet_id IN (
      SELECT id FROM wrapper_wallets WHERE
        general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
        OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their wrapper wallet transactions"
  ON native_transactions FOR UPDATE
  TO authenticated
  USING (
    wrapper_wallet_id IN (
      SELECT id FROM wrapper_wallets WHERE
        general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
        OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    wrapper_wallet_id IN (
      SELECT id FROM wrapper_wallets WHERE
        general_wallet_id IN (SELECT id FROM general_wallets WHERE user_id = auth.uid())
        OR user_wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
    )
  );

-- Policies for chain_configurations (public read)
CREATE POLICY "Anyone can view chain configurations"
  ON chain_configurations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_general_wallets_updated_at
  BEFORE UPDATE ON general_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wrapper_wallets_updated_at
  BEFORE UPDATE ON wrapper_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();