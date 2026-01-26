import { supabase } from '../lib/supabase';

export interface Wallet {
  id: string;
  user_id: string | null;
  wallet_address: string;
  public_key: string;
  encrypted_private_key: string;
  wallet_name: string;
  balance: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

class WalletService {
  async generateWallet(walletName: string = 'My Wallet'): Promise<Wallet> {
    const keyPair = await this.generateKeyPair();
    const walletAddress = this.deriveAddress(keyPair.publicKey);

    const encryptedPrivateKey = await this.encryptPrivateKey(keyPair.privateKey);

    const { data, error } = await supabase
      .from('user_wallets')
      .insert({
        wallet_address: walletAddress,
        public_key: keyPair.publicKey,
        encrypted_private_key: encryptedPrivateKey,
        wallet_name: walletName,
        balance: 0,
        is_primary: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyExport = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyExport = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKey = this.arrayBufferToHex(publicKeyExport);
    const privateKey = this.arrayBufferToHex(privateKeyExport);

    return { publicKey, privateKey };
  }

  private deriveAddress(publicKey: string): string {
    const hash = publicKey.slice(0, 40);
    return `0x${hash}`;
  }

  private async encryptPrivateKey(privateKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return this.arrayBufferToHex(encrypted);
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getWalletBalance(walletAddress: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) return 0;
    return data?.balance || 0;
  }

  async updateWalletBalance(walletAddress: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('wallet_address', walletAddress);

    if (error) throw error;
  }

  async setPrimaryWallet(walletId: string, userId: string): Promise<void> {
    await supabase
      .from('user_wallets')
      .update({ is_primary: false })
      .eq('user_id', userId);

    const { error } = await supabase
      .from('user_wallets')
      .update({ is_primary: true })
      .eq('id', walletId);

    if (error) throw error;
  }

  async exportWallet(walletAddress: string): Promise<{ address: string; publicKey: string }> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('wallet_address, public_key')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) throw error;

    return {
      address: data.wallet_address,
      publicKey: data.public_key,
    };
  }

  generateWalletBackup(wallet: Wallet): string {
    const backup = {
      address: wallet.wallet_address,
      publicKey: wallet.public_key,
      encryptedPrivateKey: wallet.encrypted_private_key,
      name: wallet.wallet_name,
      exportDate: new Date().toISOString(),
      warning: 'Keep this backup secure. Anyone with access can control your wallet.',
    };

    return JSON.stringify(backup, null, 2);
  }

  downloadWalletBackup(wallet: Wallet): void {
    const backup = this.generateWalletBackup(wallet);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hashburst-wallet-${wallet.wallet_address.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const walletService = new WalletService();
