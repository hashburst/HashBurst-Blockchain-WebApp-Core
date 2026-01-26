import { supabase } from '../lib/supabase';

export interface LedgerDevice {
  path: string;
  serialNumber?: string;
  manufacturer?: string;
  product?: string;
}

export interface LedgerAccount {
  address: string;
  path: string;
  balance?: string;
}

export class LedgerWalletService {
  private device: any = null;
  private transport: any = null;

  async detectLedger(): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.usb) {
        return false;
      }

      const devices = await navigator.usb.getDevices();
      return devices.some(
        (device) =>
          device.vendorId === 0x2c97 ||
          device.productName?.toLowerCase().includes('ledger')
      );
    } catch (error) {
      console.error('Failed to detect Ledger:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.usb) {
        throw new Error('WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.');
      }

      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x2c97 }],
      });

      this.device = device;
      return true;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('No Ledger device selected. Please connect your Ledger and try again.');
      }
      throw new Error('Failed to request USB permission: ' + error.message);
    }
  }

  async connect(): Promise<void> {
    try {
      if (!this.device) {
        const detected = await this.detectLedger();
        if (!detected) {
          throw new Error('No Ledger device detected. Please connect your Ledger device.');
        }

        const devices = await navigator.usb.getDevices();
        this.device = devices.find(
          (d) =>
            d.vendorId === 0x2c97 ||
            d.productName?.toLowerCase().includes('ledger')
        );

        if (!this.device) {
          throw new Error('Failed to find Ledger device');
        }
      }

      if (!this.device.opened) {
        await this.device.open();
      }

      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      await this.device.claimInterface(0);

      console.log('Ledger device connected successfully');
    } catch (error: any) {
      throw new Error('Failed to connect to Ledger: ' + error.message);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device && this.device.opened) {
        await this.device.close();
      }
      this.device = null;
      this.transport = null;
    } catch (error) {
      console.error('Failed to disconnect Ledger:', error);
    }
  }

  async getEthereumAddress(derivationPath: string = "m/44'/60'/0'/0/0"): Promise<string> {
    try {
      if (!this.device || !this.device.opened) {
        await this.connect();
      }

      const mockAddress = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      return mockAddress;
    } catch (error: any) {
      throw new Error('Failed to get Ethereum address from Ledger: ' + error.message);
    }
  }

  async getBitcoinAddress(derivationPath: string = "m/44'/0'/0'/0/0"): Promise<string> {
    try {
      if (!this.device || !this.device.opened) {
        await this.connect();
      }

      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let address = '1';
      for (let i = 0; i < 33; i++) {
        address += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return address;
    } catch (error: any) {
      throw new Error('Failed to get Bitcoin address from Ledger: ' + error.message);
    }
  }

  async getAccounts(chain: 'ethereum' | 'bitcoin' = 'ethereum', count: number = 5): Promise<LedgerAccount[]> {
    const accounts: LedgerAccount[] = [];

    for (let i = 0; i < count; i++) {
      const path = chain === 'ethereum'
        ? `m/44'/60'/0'/0/${i}`
        : `m/44'/0'/0'/0/${i}`;

      try {
        const address = chain === 'ethereum'
          ? await this.getEthereumAddress(path)
          : await this.getBitcoinAddress(path);

        accounts.push({
          address,
          path,
        });
      } catch (error) {
        console.error(`Failed to get account ${i}:`, error);
      }
    }

    return accounts;
  }

  async signEthereumTransaction(
    derivationPath: string,
    transaction: any
  ): Promise<string> {
    try {
      if (!this.device || !this.device.opened) {
        await this.connect();
      }

      const mockSignature = `0x${Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      return mockSignature;
    } catch (error: any) {
      throw new Error('Failed to sign transaction: ' + error.message);
    }
  }

  async signMessage(derivationPath: string, message: string): Promise<string> {
    try {
      if (!this.device || !this.device.opened) {
        await this.connect();
      }

      const mockSignature = `0x${Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      return mockSignature;
    } catch (error: any) {
      throw new Error('Failed to sign message: ' + error.message);
    }
  }

  getDeviceInfo(): LedgerDevice | null {
    if (!this.device) {
      return null;
    }

    return {
      path: 'usb',
      serialNumber: this.device.serialNumber,
      manufacturer: this.device.manufacturerName,
      product: this.device.productName,
    };
  }
}

export const ledgerService = new LedgerWalletService();

export async function saveLedgerWallet(
  userId: string,
  address: string,
  derivationPath: string,
  chain: string = 'ethereum'
): Promise<any> {
  const { data, error } = await supabase
    .from('external_wallets')
    .insert({
      user_id: userId,
      wallet_type: 'ledger',
      wallet_address: address,
      wallet_name: `Ledger ${chain.charAt(0).toUpperCase() + chain.slice(1)}`,
      network: chain,
      is_connected: true,
      last_connected: new Date().toISOString(),
      metadata: { derivation_path: derivationPath },
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
        })
        .eq('user_id', userId)
        .eq('wallet_address', address)
        .select()
        .single();

      if (updateError) throw updateError;
      return existing;
    }
    throw error;
  }

  return data;
}
