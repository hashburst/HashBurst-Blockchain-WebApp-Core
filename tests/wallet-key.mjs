import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'hashburst-wallet-test-'));
try {
  const outfile = join(dir, 'crypto.mjs');
  await build({entryPoints:['src/lib/crypto.ts'], outfile, bundle:true, platform:'node', format:'esm'});
  const crypto = await import(pathToFileURL(outfile).href);
  // Published secp256k1 generator point / Ethereum private-key-one vector.
  const key = crypto.keyPairFromPrivateKey('0'.repeat(63)+'1');
  assert.equal(key.address, '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf');
  assert.equal(key.publicKeyHex.length, 128);
  for (const invalid of ['0'.repeat(64), 'f'.repeat(64), 'z'.repeat(64), '1']) {
    assert.throws(() => crypto.keyPairFromPrivateKey(invalid));
  }
  const generated = await crypto.generateKeyPair();
  assert.deepEqual(crypto.keyPairFromPrivateKey(generated.privateKeyHex), generated);
  const encrypted = await crypto.encryptPrivateKey(key.privateKeyHex, 'test-password-only');
  const decrypted = await crypto.decryptPrivateKey(encrypted.encryptedPrivateKey, encrypted.salt, encrypted.iv, 'test-password-only');
  assert.equal(crypto.keyPairFromPrivateKey(decrypted).address, key.address);
  console.log('WALLET_ADDRESS_AND_ENCRYPTED_ROUNDTRIP_OK');
} finally { await rm(dir, {recursive:true,force:true}); }
