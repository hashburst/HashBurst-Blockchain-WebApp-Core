import { supabase } from '../lib/supabase';

export type ExternalWalletType = 'metamask' | 'trust' | 'tronlink' | 'ledger';

export interface ExternalWalletConnection {
  id: string;
  user_id: string;
  wallet_type: ExternalWalletType;
  wallet_address: string;
  wallet_name: string;
  chain_id?: number;
  network?: string;
  balance?: number;
  is_connected: boolean;
  last_connected: string;
  created_at: string;
}

declare global {
  interface Window {
    ethereum?: any;
    tronWeb?: any;
    trustWallet?: any;
  }
}

export async function detectMetaMask(): Promise<boolean> {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export async function connectMetaMask(): Promise<{
  address: string;
  chainId: number;
}> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error('Failed to connect to MetaMask: ' + error.message);
  }
}

export async function getMetaMaskBalance(address: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    return (parseInt(balance, 16) / 1e18).toFixed(4);
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';
  }
}

export async function switchMetaMaskNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      throw new Error('This network is not available in your MetaMask');
    }
    throw error;
  }
}

export async function detectTrustWallet(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    (typeof window.ethereum !== 'undefined' && window.ethereum.isTrust === true)
  );
}

export async function connectTrustWallet(): Promise<{
  address: string;
  chainId: number;
}> {
  if (!window.ethereum || !window.ethereum.isTrust) {
    throw new Error('Trust Wallet is not installed. Please install Trust Wallet app or extension.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error('Failed to connect to Trust Wallet: ' + error.message);
  }
}

export async function detectTronLink(): Promise<boolean> {
  return typeof window !== 'undefined' && typeof window.tronWeb !== 'undefined';
}

export async function connectTronLink(): Promise<{
  address: string;
  network: string;
}> {
  if (!window.tronWeb) {
    throw new Error('TronLink is not installed. Please install TronLink extension.');
  }

  try {
    if (!window.tronWeb.ready) {
      await new Promise((resolve) => {
        const checkReady = setInterval(() => {
          if (window.tronWeb && window.tronWeb.ready) {
            clearInterval(checkReady);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkReady);
          resolve(false);
        }, 10000);
      });
    }

    if (!window.tronWeb.ready) {
      throw new Error('TronLink is not ready. Please unlock your wallet.');
    }

    const address = window.tronWeb.defaultAddress.base58;
    const network = window.tronWeb.fullNode.host.includes('shasta') ? 'Shasta' : 'Mainnet';

    return {
      address,
      network,
    };
  } catch (error: any) {
    throw new Error('Failed to connect to TronLink: ' + error.message);
  }
}

export async function getTronBalance(address: string): Promise<string> {
  if (!window.tronWeb) {
    throw new Error('TronLink is not installed');
  }

  try {
    const balance = await window.tronWeb.trx.getBalance(address);
    return (balance / 1e6).toFixed(4);
  } catch (error) {
    console.error('Failed to get TRX balance:', error);
    return '0';
  }
}

export async function saveExternalWallet(
  userId: string,
  walletType: ExternalWalletType,
  address: string,
  chainId?: number,
  network?: string
): Promise<ExternalWalletConnection> {
  const walletName = `${walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet`;

  const { data, error } = await supabase
    .from('external_wallets')
    .insert({
      user_id: userId,
      wallet_type: walletType,
      wallet_address: address,
      wallet_name: walletName,
      chain_id: chainId,
      network: network,
      is_connected: true,
      last_connected: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: updateError } = await supabase
        .from('external_wallets')
        .update({
          is_connected: true,
          last_connected: new Date().toISOString(),
          chain_id: chainId,
          network: network,
        })
        .eq('user_id', userId)
        .eq('wallet_address', address)
        .select()
        .single();

      if (updateError) throw updateError;
      return existing as ExternalWalletConnection;
    }
    throw error;
  }

  return data as ExternalWalletConnection;
}

export async function getExternalWallets(userId: string): Promise<ExternalWalletConnection[]> {
  const { data, error } = await supabase
    .from('external_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('last_connected', { ascending: false });

  if (error) throw error;
  return (data || []) as ExternalWalletConnection[];
}

export async function disconnectExternalWallet(walletId: string): Promise<void> {
  const { error } = await supabase
    .from('external_wallets')
    .update({ is_connected: false })
    .eq('id', walletId);

  if (error) throw error;
}

export async function updateWalletBalance(
  walletId: string,
  balance: number
): Promise<void> {
  const { error } = await supabase
    .from('external_wallets')
    .update({ balance })
    .eq('id', walletId);

  if (error) throw error;
}

export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    56: 'BSC Mainnet',
    97: 'BSC Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    43114: 'Avalanche C-Chain',
    43113: 'Fuji Testnet',
    250: 'Fantom Opera',
    4002: 'Fantom Testnet',
    42161: 'Arbitrum One',
    421613: 'Arbitrum Goerli',
    10: 'Optimism',
    420: 'Optimism Goerli',
  };

  return networks[chainId] || `Chain ID: ${chainId}`;
}

export function getWalletIcon(walletType: ExternalWalletType): string {
  const icons: Record<ExternalWalletType, string> = {
    metamask: '🦊',
    trust: '🛡️',
    tronlink: '⚡',
    ledger: '🔐',
  };

  return icons[walletType] || '💼';
}

export async function signMessage(
  walletType: ExternalWalletType,
  message: string,
  address: string
): Promise<string> {
  try {
    if (walletType === 'metamask' || walletType === 'trust') {
      if (!window.ethereum) {
        throw new Error('Wallet not found');
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      return signature;
    } else if (walletType === 'tronlink') {
      if (!window.tronWeb) {
        throw new Error('TronLink not found');
      }

      const signature = await window.tronWeb.trx.sign(message);
      return signature;
    }

    throw new Error('Unsupported wallet type for signing');
  } catch (error: any) {
    throw new Error('Failed to sign message: ' + error.message);
  }
}
