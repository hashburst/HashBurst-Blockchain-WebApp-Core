/**
 * src/lib/crypto.ts  — versione produzione con @noble/secp256k1
 *
 * Usa secp256k1 + keccak256 identico a Ethereum.
 * Cifra con AES-256-GCM via Web Crypto API nativa.
 * Zero server calls. Zero Supabase.
 */

import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

export function bufToHex(buf: Uint8Array | ArrayBuffer): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('');
}

export function hexToBuf(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    b[i/2] = parseInt(hex.slice(i, i+2), 16);
  return b;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey('raw',
    new TextEncoder().encode(password), { name:'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:100_000, hash:'SHA-256' },
    raw, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']
  );
}

export async function encryptPrivateKey(privateKeyHex: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key,
    new TextEncoder().encode(privateKeyHex));
  return { encryptedPrivateKey: bufToHex(new Uint8Array(ct)), salt: bufToHex(salt), iv: bufToHex(iv) };
}

export async function decryptPrivateKey(
  encryptedPrivateKey: string, salt: string, iv: string, password: string
): Promise<string> {
  const key = await deriveKey(password, hexToBuf(salt));
  try {
    const pt = await crypto.subtle.decrypt(
      { name:'AES-GCM', iv: hexToBuf(iv) }, key, hexToBuf(encryptedPrivateKey));
    return new TextDecoder().decode(pt);
  } catch { throw new Error('Password errata o wallet corrotto'); }
}

export interface KeyPair { privateKeyHex: string; publicKeyHex: string; address: string; }

export async function generateKeyPair(): Promise<KeyPair> {
  const priv   = secp.utils.randomPrivateKey();
  const pubFull = secp.getPublicKey(priv, false);
  const pub     = pubFull.slice(1);
  const hash    = keccak_256(pub);
  return { privateKeyHex: bufToHex(priv), publicKeyHex: bufToHex(pub),
           address: '0x' + bufToHex(hash).slice(24) };
}

export async function signMessage(messageHex: string, privateKeyHex: string): Promise<string> {
  const sig = await secp.signAsync(keccak_256(hexToBuf(messageHex)), hexToBuf(privateKeyHex));
  return bufToHex(sig.toCompactRawBytes());
}

export function generateId(): string {
  return bufToHex(crypto.getRandomValues(new Uint8Array(16)));
}

export interface PasswordStrength { score: 0|1|2|3|4; label: string; color: string; ok: boolean; }

export function checkPasswordStrength(pwd: string): PasswordStrength {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) s++;
  const m: Record<number,Omit<PasswordStrength,'score'>> = {
    0:{label:'Molto debole',color:'#e74c3c',ok:false},
    1:{label:'Debole',color:'#e67e22',ok:false},
    2:{label:'Sufficiente',color:'#f1c40f',ok:true},
    3:{label:'Buona',color:'#2ecc71',ok:true},
    4:{label:'Ottima',color:'#27ae60',ok:true},
  };
  return { score: s as PasswordStrength['score'], ...m[s] };
}
