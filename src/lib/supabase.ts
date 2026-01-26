import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BlockchainRecord = {
  id: string;
  record_type: 'file' | 'event' | 'data' | 'contract';
  title: string;
  description: string;
  ipfs_hash: string | null;
  blockchain_hash: string | null;
  metadata: Record<string, any>;
  file_size: number | null;
  file_type: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NetworkNode = {
  id: string;
  node_name: string;
  node_type: 'virtual' | 'ipfs' | 'validator';
  endpoint: string;
  status: 'online' | 'offline' | 'syncing';
  last_block: number;
  last_ping: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type SmartContract = {
  id: string;
  contract_name: string;
  contract_address: string;
  contract_type: 'HBT-20' | 'HBT-721' | 'custom';
  abi: any[];
  bytecode: string | null;
  deployed_by: string | null;
  deployed_at: string;
  status: 'active' | 'deprecated';
  metadata: Record<string, any>;
  created_at: string;
};

export type BlockchainEvent = {
  id: string;
  event_type: string;
  event_name: string;
  transaction_hash: string;
  block_number: number;
  contract_address: string | null;
  event_data: Record<string, any>;
  timestamp: string;
  created_at: string;
};
