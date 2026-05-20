/**
 * src/services/wallet.ts
 *
 * Servizio wallet completamente locale.
 * Sostituisce il vecchio wallet.ts che scriveva su Supabase.
 *
 * Ciclo di vita di una chiave privata:
 *
 *   GENERAZIONE  →  in RAM (mai su disco in chiaro)
 *       ↓
 *   CIFRATURA    →  AES-256-GCM + PBKDF2(password, 100K iter)
 *       ↓
 *   SALVATAGGIO  →  IndexedDB locale (solo blob cifrato + salt + IV)
 *       ↓
 *   USO          →  decifratura in RAM su richiesta, scartata dopo uso
 *       ↓
 *   EXPORT       →  file .json cifrato scaricabile (backup)
 */

import {
  encryptPrivateKey,
  decryptPrivateKey,
  generateKeyPair,
  generateId,
  checkPasswordStrength,
  type PasswordStrength,
} from '../lib/crypto';
import {
  walletStore,
  type StoredWallet,
} from '../lib/localStore';

export type { StoredWallet, PasswordStrength };
export { checkPasswordStrength };

// ─── Creazione nuovo wallet ───────────────────────────────────────────────────

export interface CreateWalletResult {
  wallet:         StoredWallet;
  privateKeyHex:  string;   // consegnato UNA SOLA VOLTA all'utente
}

export async function createWallet(
  name: string,
  password: string
): Promise<CreateWalletResult> {
  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    throw new Error(
      `Password troppo debole (${strength.label}). Usa almeno 8 caratteri con maiuscole, numeri e simboli.`
    );
  }

  const keys = await generateKeyPair();

  const { encryptedPrivateKey, salt, iv } = await encryptPrivateKey(
    keys.privateKeyHex,
    password
  );

  const wallet: StoredWallet = {
    id:                 generateId(),
    name:               name.trim() || `Wallet ${Date.now()}`,
    address:            keys.address,
    publicKey:          keys.publicKeyHex,
    encryptedPrivateKey,
    salt,
    iv,
    createdAt:          new Date().toISOString(),
    balance:            0,
  };

  await walletStore.save(wallet);

  return {
    wallet,
    privateKeyHex: keys.privateKeyHex,  // mostrato solo ora, poi dimenticato
  };
}

// ─── Importazione wallet da chiave privata ────────────────────────────────────

export async function importWalletFromPrivateKey(
  name: string,
  privateKeyHex: string,
  password: string
): Promise<StoredWallet> {
  if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new Error('Chiave privata non valida — deve essere 64 caratteri hex');
  }
  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    throw new Error(`Password troppo debole: ${strength.label}`);
  }

  // Ricava address dalla chiave privata
  // (in produzione: secp256k1 → keccak256; qui SHA-256 per demo)
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256',
    enc.encode(privateKeyHex));
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2,'0')).join('');
  const address = '0x' + hashHex.slice(24);

  const { encryptedPrivateKey, salt, iv } = await encryptPrivateKey(
    privateKeyHex, password
  );

  const wallet: StoredWallet = {
    id: generateId(),
    name: name.trim() || 'Wallet importato',
    address,
    publicKey: hashHex,
    encryptedPrivateKey,
    salt,
    iv,
    createdAt: new Date().toISOString(),
    balance: 0,
  };

  await walletStore.save(wallet);
  return wallet;
}

// ─── Sblocco wallet (decifratura in RAM) ──────────────────────────────────────

export async function unlockWallet(
  walletId: string,
  password: string
): Promise<string> {
  const wallet = await walletStore.getById(walletId);
  if (!wallet) throw new Error('Wallet non trovato');

  return decryptPrivateKey(
    wallet.encryptedPrivateKey,
    wallet.salt,
    wallet.iv,
    password
  );
}

// ─── Lettura wallets ──────────────────────────────────────────────────────────

export async function getAllWallets(): Promise<StoredWallet[]> {
  return walletStore.getAll();
}

export async function getWalletById(id: string): Promise<StoredWallet | undefined> {
  return walletStore.getById(id);
}

// ─── Rinomina wallet ──────────────────────────────────────────────────────────

export async function renameWallet(id: string, newName: string): Promise<void> {
  const w = await walletStore.getById(id);
  if (!w) throw new Error('Wallet non trovato');
  await walletStore.save({ ...w, name: newName.trim() });
}

// ─── Eliminazione wallet ──────────────────────────────────────────────────────

export async function deleteWallet(id: string): Promise<void> {
  await walletStore.delete(id);
}

// ─── Aggiornamento balance ────────────────────────────────────────────────────

export async function updateBalance(
  address: string,
  balance: number
): Promise<void> {
  const w = await walletStore.getByAddress(address);
  if (!w) return;
  await walletStore.save({ ...w, balance });
}

// ─── Export / Import backup ───────────────────────────────────────────────────

/**
 * Esporta un singolo wallet in formato JSON scaricabile.
 * La chiave privata è già cifrata — il file è sicuro da salvare.
 */
export function exportWalletToFile(wallet: StoredWallet): void {
  const json = JSON.stringify(
    {
      version:   2,
      type:      'hashburst-wallet',
      exportedAt: new Date().toISOString(),
      wallet:    {
        id:                 wallet.id,
        name:               wallet.name,
        address:            wallet.address,
        publicKey:          wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        salt:               wallet.salt,
        iv:                 wallet.iv,
        createdAt:          wallet.createdAt,
      },
    },
    null, 2
  );

  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `hashburst-wallet-${wallet.address.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa un wallet da file JSON.
 * Richiede la password originale per verificare che sia corretta.
 */
export async function importWalletFromFile(
  jsonContent: string,
  password: string
): Promise<StoredWallet> {
  const data = JSON.parse(jsonContent);
  if (data.type !== 'hashburst-wallet') {
    throw new Error('File non riconosciuto come wallet HashBurst');
  }

  const w = data.wallet as StoredWallet;

  // Verifica che la password sia corretta prima di salvare
  await decryptPrivateKey(w.encryptedPrivateKey, w.salt, w.iv, password);

  await walletStore.save(w);
  return w;
}

// ─── Cambio password ──────────────────────────────────────────────────────────

export async function changePassword(
  walletId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) {
    throw new Error(`Nuova password troppo debole: ${strength.label}`);
  }

  // Decifra con la vecchia password
  const privateKeyHex = await unlockWallet(walletId, oldPassword);

  // Ricicla con la nuova
  const { encryptedPrivateKey, salt, iv } = await encryptPrivateKey(
    privateKeyHex, newPassword
  );

  const w = await walletStore.getById(walletId);
  if (!w) throw new Error('Wallet non trovato');

  await walletStore.save({ ...w, encryptedPrivateKey, salt, iv });
}
