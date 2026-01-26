-- Create eIDAS 2.0 EUDI Wallet Schema
--
-- Overview:
-- This migration creates the complete schema for eIDAS 2.0 compliant EUDI Wallets,
-- implementing EU Digital Identity Wallet standards with W3C Verifiable Credentials.
--
-- 1. New Tables
--    - eidas_wallets: Core wallet instances
--    - person_identification_data: PID (Person Identification Data)
--    - verifiable_credentials: W3C Verifiable Credentials
--    - attestations: Electronic Attestations of Attributes (EAA)
--    - credential_presentations: Presentation records
--    - trusted_issuers: Trusted issuer registry
--    - wallet_audit_log: Audit trail
--
-- 2. Security
--    - Enable RLS on all tables
--    - Policies for wallet owners to access their data
--    - Restricted access to sensitive PID data
--
-- 3. Indexes
--    - Performance indexes on foreign keys
--    - Unique constraints on DIDs and credential IDs

-- Create eidas_wallets table
CREATE TABLE IF NOT EXISTS eidas_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_did text UNIQUE NOT NULL,
  public_key text NOT NULL,
  encrypted_private_key text NOT NULL,
  key_algorithm text NOT NULL DEFAULT 'EdDSA',
  trust_level text NOT NULL DEFAULT 'substantial',
  wallet_provider text NOT NULL DEFAULT 'HashBurst EUDI Wallet',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  CONSTRAINT valid_trust_level CHECK (trust_level IN ('low', 'substantial', 'high')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'revoked'))
);

-- Create person_identification_data table
CREATE TABLE IF NOT EXISTS person_identification_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES eidas_wallets(id) ON DELETE CASCADE,
  given_name text NOT NULL,
  family_name text NOT NULL,
  birth_date date NOT NULL,
  birth_place text,
  nationality text NOT NULL,
  gender text,
  national_id text,
  issuing_authority text NOT NULL,
  issuing_country text NOT NULL,
  issuance_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'valid',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_pid_status CHECK (status IN ('valid', 'expired', 'revoked'))
);

-- Create verifiable_credentials table
CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES eidas_wallets(id) ON DELETE CASCADE,
  credential_id text UNIQUE NOT NULL,
  credential_type text NOT NULL,
  credential_schema text,
  issuer_did text NOT NULL,
  issuer_name text NOT NULL,
  subject_did text NOT NULL,
  credential_data jsonb NOT NULL DEFAULT '{}',
  proof jsonb NOT NULL DEFAULT '{}',
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_vc_status CHECK (status IN ('active', 'revoked', 'suspended', 'expired'))
);

-- Create attestations table
CREATE TABLE IF NOT EXISTS attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES eidas_wallets(id) ON DELETE CASCADE,
  attestation_type text NOT NULL,
  attestation_name text NOT NULL,
  issuer_did text NOT NULL,
  issuer_name text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}',
  proof jsonb NOT NULL DEFAULT '{}',
  selective_disclosure_enabled boolean DEFAULT false,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_attestation_status CHECK (status IN ('active', 'revoked', 'suspended', 'expired'))
);

-- Create credential_presentations table
CREATE TABLE IF NOT EXISTS credential_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES eidas_wallets(id) ON DELETE CASCADE,
  credential_id uuid REFERENCES verifiable_credentials(id) ON DELETE SET NULL,
  relying_party_did text NOT NULL,
  relying_party_name text NOT NULL,
  disclosed_attributes jsonb NOT NULL DEFAULT '{}',
  presentation_token text,
  verified boolean DEFAULT false,
  presented_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create trusted_issuers table
CREATE TABLE IF NOT EXISTS trusted_issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_did text UNIQUE NOT NULL,
  issuer_name text NOT NULL,
  issuer_country text NOT NULL,
  certificate_data jsonb NOT NULL DEFAULT '{}',
  trust_framework text,
  status text NOT NULL DEFAULT 'active',
  registered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_issuer_status CHECK (status IN ('active', 'suspended', 'revoked'))
);

-- Create wallet_audit_log table
CREATE TABLE IF NOT EXISTS wallet_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES eidas_wallets(id) ON DELETE CASCADE,
  operation_type text NOT NULL,
  operation_details jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_eidas_wallets_user_id ON eidas_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_eidas_wallets_wallet_did ON eidas_wallets(wallet_did);
CREATE INDEX IF NOT EXISTS idx_pid_wallet_id ON person_identification_data(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vc_wallet_id ON verifiable_credentials(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vc_issuer_did ON verifiable_credentials(issuer_did);
CREATE INDEX IF NOT EXISTS idx_attestations_wallet_id ON attestations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_presentations_wallet_id ON credential_presentations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_wallet_id ON wallet_audit_log(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON wallet_audit_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE eidas_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_identification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for eidas_wallets
CREATE POLICY "Users can view their own wallets"
  ON eidas_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets"
  ON eidas_wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON eidas_wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for person_identification_data
CREATE POLICY "Users can view their own PID"
  ON person_identification_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = person_identification_data.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own PID"
  ON person_identification_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = person_identification_data.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own PID"
  ON person_identification_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = person_identification_data.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = person_identification_data.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

-- RLS Policies for verifiable_credentials
CREATE POLICY "Users can view their own credentials"
  ON verifiable_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = verifiable_credentials.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own credentials"
  ON verifiable_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = verifiable_credentials.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own credentials"
  ON verifiable_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = verifiable_credentials.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = verifiable_credentials.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

-- RLS Policies for attestations
CREATE POLICY "Users can view their own attestations"
  ON attestations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = attestations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own attestations"
  ON attestations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = attestations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own attestations"
  ON attestations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = attestations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = attestations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

-- RLS Policies for credential_presentations
CREATE POLICY "Users can view their own presentations"
  ON credential_presentations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = credential_presentations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own presentations"
  ON credential_presentations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = credential_presentations.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

-- RLS Policies for trusted_issuers (public read)
CREATE POLICY "Anyone can view trusted issuers"
  ON trusted_issuers FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for wallet_audit_log (read-only for owners)
CREATE POLICY "Users can view their own audit logs"
  ON wallet_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM eidas_wallets
      WHERE eidas_wallets.id = wallet_audit_log.wallet_id
      AND eidas_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON wallet_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
