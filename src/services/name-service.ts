import { supabase } from '../lib/supabase';

export interface NameRecord {
  id: string;
  walletId: string;
  name: string;
  domain: string;
  address: string;
  addresses: Record<string, string>;
  metadata: {
    avatar?: string;
    description?: string;
    email?: string;
    url?: string;
    twitter?: string;
    github?: string;
    [key: string]: any;
  };
  resolver?: string;
  expiresAt?: string;
  isPrimary: boolean;
  status: 'active' | 'expired' | 'transferred';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterNameParams {
  walletId: string;
  name: string;
  domain: 'eth' | 'hbc';
  address: string;
  addresses?: Record<string, string>;
  metadata?: any;
  isPrimary?: boolean;
}

const DOMAIN_PRICES = {
  eth: 0.01,
  hbc: 0.001,
};

const DOMAIN_DURATIONS = {
  eth: 365,
  hbc: 365,
};

export async function checkNameAvailability(name: string, domain: string): Promise<boolean> {
  const fullName = `${name}.${domain}`;

  const { data, error } = await supabase
    .from('name_service_records')
    .select('id')
    .eq('name', fullName)
    .eq('status', 'active')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !data;
}

export async function registerName(params: RegisterNameParams): Promise<NameRecord> {
  try {
    const fullName = `${params.name}.${params.domain}`;

    const isAvailable = await checkNameAvailability(params.name, params.domain);
    if (!isAvailable) {
      throw new Error(`Name ${fullName} is already taken`);
    }

    if (params.isPrimary) {
      await supabase
        .from('name_service_records')
        .update({ is_primary: false })
        .eq('wallet_id', params.walletId);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DOMAIN_DURATIONS[params.domain]);

    const { data, error } = await supabase
      .from('name_service_records')
      .insert({
        wallet_id: params.walletId,
        name: fullName,
        domain: params.domain,
        address: params.address,
        addresses: params.addresses || {},
        metadata: params.metadata || {},
        expires_at: expiresAt.toISOString(),
        is_primary: params.isPrimary || false,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return data as NameRecord;
  } catch (error) {
    console.error('Name registration failed:', error);
    throw error;
  }
}

export async function resolveName(name: string): Promise<NameRecord | null> {
  const { data, error } = await supabase
    .from('name_service_records')
    .select('*')
    .eq('name', name)
    .eq('status', 'active')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as NameRecord | null;
}

export async function resolveAddress(address: string): Promise<NameRecord | null> {
  const { data, error } = await supabase
    .from('name_service_records')
    .select('*')
    .eq('address', address)
    .eq('is_primary', true)
    .eq('status', 'active')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as NameRecord | null;
}

export async function getNamesByWallet(walletId: string): Promise<NameRecord[]> {
  const { data, error } = await supabase
    .from('name_service_records')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []) as NameRecord[];
}

export async function updateNameMetadata(
  nameId: string,
  metadata: any
): Promise<void> {
  const { error } = await supabase
    .from('name_service_records')
    .update({ metadata })
    .eq('id', nameId);

  if (error) throw error;
}

export async function updateNameAddresses(
  nameId: string,
  addresses: Record<string, string>
): Promise<void> {
  const { error } = await supabase
    .from('name_service_records')
    .update({ addresses })
    .eq('id', nameId);

  if (error) throw error;
}

export async function setPrimaryName(walletId: string, nameId: string): Promise<void> {
  await supabase
    .from('name_service_records')
    .update({ is_primary: false })
    .eq('wallet_id', walletId);

  const { error } = await supabase
    .from('name_service_records')
    .update({ is_primary: true })
    .eq('id', nameId)
    .eq('wallet_id', walletId);

  if (error) throw error;
}

export async function renewName(nameId: string): Promise<void> {
  const { data: record, error: fetchError } = await supabase
    .from('name_service_records')
    .select('domain, expires_at')
    .eq('id', nameId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!record) throw new Error('Name not found');

  const currentExpiry = new Date(record.expires_at);
  const newExpiry = new Date(currentExpiry);
  newExpiry.setDate(newExpiry.getDate() + DOMAIN_DURATIONS[record.domain as 'eth' | 'hbc']);

  const { error } = await supabase
    .from('name_service_records')
    .update({
      expires_at: newExpiry.toISOString(),
      status: 'active',
    })
    .eq('id', nameId);

  if (error) throw error;
}

export async function transferName(
  nameId: string,
  newWalletId: string,
  newAddress: string
): Promise<void> {
  const { error } = await supabase
    .from('name_service_records')
    .update({
      wallet_id: newWalletId,
      address: newAddress,
      is_primary: false,
    })
    .eq('id', nameId);

  if (error) throw error;
}

export function getNamePrice(domain: 'eth' | 'hbc'): number {
  return DOMAIN_PRICES[domain];
}

export function getDomainDuration(domain: 'eth' | 'hbc'): number {
  return DOMAIN_DURATIONS[domain];
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters long' };
  }

  if (name.length > 63) {
    return { valid: false, error: 'Name must be less than 63 characters' };
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: 'Name can only contain lowercase letters, numbers, and hyphens' };
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return { valid: false, error: 'Name cannot start or end with a hyphen' };
  }

  if (name.includes('--')) {
    return { valid: false, error: 'Name cannot contain consecutive hyphens' };
  }

  return { valid: true };
}

export function isNameFormat(input: string): boolean {
  return input.includes('.') && !input.startsWith('0x');
}

export async function resolveNameToAddress(
  nameOrAddress: string,
  chain?: string
): Promise<string> {
  if (!isNameFormat(nameOrAddress)) {
    return nameOrAddress;
  }

  if (nameOrAddress.endsWith('.eth')) {
    try {
      const ensAddress = await resolveENSName(nameOrAddress);
      if (ensAddress) return ensAddress;
    } catch (error) {
      console.error('ENS resolution failed:', error);
    }
  }

  if (nameOrAddress.endsWith('.hbc')) {
    try {
      const record = await resolveName(nameOrAddress);
      if (record) {
        if (chain && record.addresses[chain]) {
          return record.addresses[chain];
        }
        return record.address;
      }
    } catch (error) {
      console.error('HBC resolution failed:', error);
    }
  }

  const record = await resolveName(nameOrAddress);
  if (record) {
    if (chain && record.addresses[chain]) {
      return record.addresses[chain];
    }
    return record.address;
  }

  throw new Error(`Could not resolve name: ${nameOrAddress}`);
}

export async function resolveENSName(ensName: string): Promise<string | null> {
  try {
    if (!window.ethereum) {
      return null;
    }

    const address = await window.ethereum.request({
      method: 'eth_call',
      params: [
        {
          to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          data: `0x3b3b57de${ensName.replace('.eth', '').padStart(64, '0')}`,
        },
        'latest',
      ],
    });

    if (address && address !== '0x' && address.length === 66) {
      return `0x${address.slice(26)}`;
    }

    return null;
  } catch (error) {
    console.error('ENS resolution error:', error);
    return null;
  }
}

export async function resolveMultiChainAddress(
  nameOrAddress: string,
  chains: string[]
): Promise<Record<string, string>> {
  const addresses: Record<string, string> = {};

  if (!isNameFormat(nameOrAddress)) {
    for (const chain of chains) {
      addresses[chain] = nameOrAddress;
    }
    return addresses;
  }

  const record = await resolveName(nameOrAddress);
  if (!record) {
    throw new Error(`Could not resolve name: ${nameOrAddress}`);
  }

  for (const chain of chains) {
    if (record.addresses[chain]) {
      addresses[chain] = record.addresses[chain];
    }
  }

  return addresses;
}
