# Wallet import address correction

Private-key imports previously hashed the hexadecimal key text with SHA-256.
That derived an address unrelated to the secp256k1 public key. New wallet creation
already used secp256k1 and Keccak-256. Imports now use the same derivation and reject
invalid scalars before storing a wallet.

Tests check the public private-key-one vector, invalid scalar rejection,
generation/import consistency and an encrypted backup round trip. They use no
production keys. Build succeeds. The repository-wide TypeScript check still has
pre-existing errors in services that import the removed Supabase module and in
other components; this correction does not establish full application readiness.

Existing saved wallet records are not rewritten. An address previously displayed
by the incorrect import cannot be recovered by changing the address calculation.
Preserve the encrypted backup and compare the derived address locally before any
funding. This patch does not migrate funds or alter blockchain state.
