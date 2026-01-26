import { supabase } from '../lib/supabase';

interface WalletKeyPair {
  publicKey: string;
  privateKey: string;
  did: string;
  keyAlgorithm: string;
}

interface EIDASWallet {
  id: string;
  walletDid: string;
  publicKey: string;
  trustLevel: 'low' | 'substantial' | 'high';
  status: 'active' | 'suspended' | 'revoked';
  createdAt: string;
}

interface PersonIdentificationData {
  givenName: string;
  familyName: string;
  birthDate: string;
  birthPlace?: string;
  nationality: string;
  gender?: string;
  nationalId?: string;
  issuingAuthority: string;
  issuingCountry: string;
  expiryDate?: string;
}

export class EIDASWalletService {
  private static async generateKeyPair(): Promise<WalletKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      } as any,
      true,
      ['sign', 'verify']
    );

    const publicKeyRaw = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw)));

    const publicKeyBytes = new Uint8Array(publicKeyRaw).slice(-32);
    const did = `did:key:z${this.base58Encode(new Uint8Array([0xed, 0x01, ...publicKeyBytes]))}`;

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      did,
      keyAlgorithm: 'EdDSA',
    };
  }

  private static base58Encode(bytes: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    let encoded = '';

    while (num > 0n) {
      const remainder = Number(num % 58n);
      encoded = ALPHABET[remainder] + encoded;
      num = num / 58n;
    }

    for (const byte of bytes) {
      if (byte === 0) encoded = '1' + encoded;
      else break;
    }

    return encoded;
  }

  private static async encryptPrivateKey(privateKey: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);
    const passphraseData = encoder.encode(passphrase);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decryptPrivateKey(encryptedKey: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder();
    const passphraseData = encoder.encode(passphrase);

    const combined = new Uint8Array(
      atob(encryptedKey).split('').map(c => c.charCodeAt(0))
    );

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  static async createWallet(
    userId: string | null,
    passphrase: string,
    trustLevel: 'low' | 'substantial' | 'high' = 'substantial'
  ): Promise<EIDASWallet> {
    const keyPair = await this.generateKeyPair();
    const encryptedPrivateKey = await this.encryptPrivateKey(keyPair.privateKey, passphrase);

    const { data, error } = await supabase
      .from('eidas_wallets')
      .insert({
        user_id: userId,
        wallet_did: keyPair.did,
        public_key: keyPair.publicKey,
        encrypted_private_key: encryptedPrivateKey,
        key_algorithm: keyPair.keyAlgorithm,
        trust_level: trustLevel,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create wallet: ${error.message}`);

    await this.logAuditEvent(data.id, 'wallet_created', {
      trustLevel,
      did: keyPair.did,
    });

    return {
      id: data.id,
      walletDid: data.wallet_did,
      publicKey: data.public_key,
      trustLevel: data.trust_level,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  static async addPersonIdentificationData(
    walletId: string,
    pidData: PersonIdentificationData
  ): Promise<void> {
    const { error } = await supabase
      .from('person_identification_data')
      .insert({
        wallet_id: walletId,
        given_name: pidData.givenName,
        family_name: pidData.familyName,
        birth_date: pidData.birthDate,
        birth_place: pidData.birthPlace,
        nationality: pidData.nationality,
        gender: pidData.gender,
        national_id: pidData.nationalId,
        issuing_authority: pidData.issuingAuthority,
        issuing_country: pidData.issuingCountry,
        expiry_date: pidData.expiryDate,
        status: 'valid',
      });

    if (error) throw new Error(`Failed to add PID: ${error.message}`);

    await this.logAuditEvent(walletId, 'pid_added', {
      givenName: pidData.givenName,
      familyName: pidData.familyName,
    });
  }

  static async getWallet(walletId: string): Promise<EIDASWallet | null> {
    const { data, error } = await supabase
      .from('eidas_wallets')
      .select('*')
      .eq('id', walletId)
      .maybeSingle();

    if (error) throw new Error(`Failed to get wallet: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      walletDid: data.wallet_did,
      publicKey: data.public_key,
      trustLevel: data.trust_level,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  static async getUserWallets(userId: string): Promise<EIDASWallet[]> {
    const { data, error } = await supabase
      .from('eidas_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get wallets: ${error.message}`);

    return (data || []).map(wallet => ({
      id: wallet.id,
      walletDid: wallet.wallet_did,
      publicKey: wallet.public_key,
      trustLevel: wallet.trust_level,
      status: wallet.status,
      createdAt: wallet.created_at,
    }));
  }

  static async getPersonIdentificationData(walletId: string) {
    const { data, error } = await supabase
      .from('person_identification_data')
      .select('*')
      .eq('wallet_id', walletId)
      .maybeSingle();

    if (error) throw new Error(`Failed to get PID: ${error.message}`);
    return data;
  }

  static async revokeWallet(walletId: string): Promise<void> {
    const { error } = await supabase
      .from('eidas_wallets')
      .update({ status: 'revoked' })
      .eq('id', walletId);

    if (error) throw new Error(`Failed to revoke wallet: ${error.message}`);

    await this.logAuditEvent(walletId, 'wallet_revoked', {});
  }

  private static async logAuditEvent(
    walletId: string,
    operationType: string,
    details: Record<string, any>
  ): Promise<void> {
    await supabase.from('wallet_audit_log').insert({
      wallet_id: walletId,
      operation_type: operationType,
      operation_details: details,
      success: true,
    });
  }

  static async getAuditLog(walletId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('wallet_audit_log')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get audit log: ${error.message}`);
    return data || [];
  }
}
