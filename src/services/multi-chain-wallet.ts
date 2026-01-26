import { supabase } from '../lib/supabase';

export interface ChainConfig {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  explorer_url: string;
  rpc_url?: string;
  icon: string;
  is_testnet: boolean;
  is_active: boolean;
}

export interface WrapperWallet {
  id: string;
  general_wallet_id?: string;
  user_wallet_id: string;
  chain: string;
  address: string;
  public_key?: string;
  encrypted_private_key?: string;
  balance: number;
  balance_usd: number;
  derivation_path?: string;
  is_active: boolean;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneralWallet {
  id: string;
  user_id: string;
  wallet_id: string;
  name: string;
  description?: string;
  total_balance_usd: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NativeTransaction {
  id: string;
  wrapper_wallet_id: string;
  transaction_hash: string;
  chain: string;
  from_address: string;
  to_address: string;
  amount: number;
  amount_usd?: number;
  fee: number;
  block_number?: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  transaction_type: 'send' | 'receive' | 'internal';
  metadata: any;
  timestamp: string;
  created_at: string;
}

export async function getSupportedChains(): Promise<ChainConfig[]> {
  const { data, error } = await supabase
    .from('chain_configurations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data || []) as ChainConfig[];
}

export async function createGeneralWallet(
  userId: string,
  mainWalletId: string,
  name: string,
  description?: string
): Promise<GeneralWallet> {
  const { data, error } = await supabase
    .from('general_wallets')
    .insert({
      user_id: userId,
      wallet_id: mainWalletId,
      name,
      description,
      total_balance_usd: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as GeneralWallet;
}

export async function getGeneralWallets(userId: string): Promise<GeneralWallet[]> {
  const { data, error } = await supabase
    .from('general_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as GeneralWallet[];
}

export async function generateWrapperWallet(
  chain: string,
  generalWalletId?: string,
  userWalletId?: string
): Promise<WrapperWallet> {
  const address = generateChainAddress(chain);
  const { publicKey, privateKey } = generateKeyPair();
  const encryptedPrivateKey = await encryptPrivateKey(privateKey);

  const { data, error } = await supabase
    .from('wrapper_wallets')
    .insert({
      general_wallet_id: generalWalletId,
      user_wallet_id: userWalletId,
      chain,
      address,
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey,
      balance: 0,
      balance_usd: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WrapperWallet;
}

export async function getWrapperWallets(
  generalWalletId?: string,
  userWalletId?: string
): Promise<WrapperWallet[]> {
  let query = supabase.from('wrapper_wallets').select('*').eq('is_active', true);

  if (generalWalletId) {
    query = query.eq('general_wallet_id', generalWalletId);
  } else if (userWalletId) {
    query = query.eq('user_wallet_id', userWalletId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as WrapperWallet[];
}

export async function recordNativeTransaction(
  wrapperWalletId: string,
  txData: {
    transaction_hash: string;
    chain: string;
    from_address: string;
    to_address: string;
    amount: number;
    fee?: number;
    block_number?: number;
    transaction_type: 'send' | 'receive' | 'internal';
    metadata?: any;
  }
): Promise<NativeTransaction> {
  const { data, error } = await supabase
    .from('native_transactions')
    .insert({
      wrapper_wallet_id: wrapperWalletId,
      transaction_hash: txData.transaction_hash,
      chain: txData.chain,
      from_address: txData.from_address,
      to_address: txData.to_address,
      amount: txData.amount,
      fee: txData.fee || 0,
      block_number: txData.block_number,
      confirmations: 0,
      status: 'pending',
      transaction_type: txData.transaction_type,
      metadata: txData.metadata || {},
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as NativeTransaction;
}

export async function getNativeTransactions(
  wrapperWalletId: string
): Promise<NativeTransaction[]> {
  const { data, error } = await supabase
    .from('native_transactions')
    .select('*')
    .eq('wrapper_wallet_id', wrapperWalletId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return (data || []) as NativeTransaction[];
}

export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed',
  confirmations?: number
): Promise<void> {
  const updateData: any = { status };
  if (confirmations !== undefined) {
    updateData.confirmations = confirmations;
  }

  const { error } = await supabase
    .from('native_transactions')
    .update(updateData)
    .eq('id', transactionId);

  if (error) throw error;
}

export async function updateWrapperWalletBalance(
  wrapperWalletId: string,
  balance: number,
  balanceUsd: number
): Promise<void> {
  const { error } = await supabase
    .from('wrapper_wallets')
    .update({
      balance,
      balance_usd: balanceUsd,
      last_synced: new Date().toISOString(),
    })
    .eq('id', wrapperWalletId);

  if (error) throw error;
}

export async function syncWrapperWallet(wrapperWalletId: string): Promise<void> {
  const mockBalance = Math.random() * 10;
  const mockBalanceUsd = mockBalance * (Math.random() * 50000 + 10000);

  await updateWrapperWalletBalance(wrapperWalletId, mockBalance, mockBalanceUsd);
}

export async function calculateGeneralWalletBalance(
  generalWalletId: string
): Promise<number> {
  const wrappers = await getWrapperWallets(generalWalletId);
  const totalUsd = wrappers.reduce((sum, w) => sum + w.balance_usd, 0);

  const { error } = await supabase
    .from('general_wallets')
    .update({ total_balance_usd: totalUsd })
    .eq('id', generalWalletId);

  if (error) throw error;

  return totalUsd;
}

function generateChainAddress(chain: string): string {
  const prefixes: Record<string, string> = {
    BTC: '1',
    BCH: 'q',
    ETC: '0x',
    LTC: 'L',
    ZEC: 't1',
    XMR: '4',
    DOGE: 'D',
    DASH: 'X',
  };

  const prefix = prefixes[chain] || '0x';
  const length = chain === 'XMR' ? 95 : chain === 'ETC' ? 40 : 34;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let address = prefix;
  for (let i = prefix.length; i < length; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return address;
}

function generateKeyPair(): { publicKey: string; privateKey: string } {
  const publicKey = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const privateKey = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return { publicKey, privateKey };
}

async function encryptPrivateKey(privateKey: string): Promise<string> {
  return btoa(privateKey);
}

export async function decryptPrivateKey(encryptedKey: string): Promise<string> {
  return atob(encryptedKey);
}

export function getChainExplorerUrl(chain: string, address: string): string {
  const explorers: Record<string, string> = {
    BTC: `https://blockchair.com/bitcoin/address/${address}`,
    BCH: `https://blockchair.com/bitcoin-cash/address/${address}`,
    ETC: `https://blockscout.com/etc/mainnet/address/${address}`,
    LTC: `https://blockchair.com/litecoin/address/${address}`,
    ZEC: `https://blockchair.com/zcash/address/${address}`,
    XMR: `https://xmrchain.net/search?value=${address}`,
    DOGE: `https://blockchair.com/dogecoin/address/${address}`,
    DASH: `https://blockchair.com/dash/address/${address}`,
  };

  return explorers[chain] || '#';
}

export function getChainIcon(chain: string): string {
  const icons: Record<string, string> = {
    BTC: '₿',
    BCH: 'BCH',
    ETC: 'ETC',
    LTC: 'Ł',
    ZEC: 'ⓩ',
    XMR: 'ɱ',
    DOGE: 'Ð',
    DASH: 'Đ',
  };

  return icons[chain] || chain;
}
