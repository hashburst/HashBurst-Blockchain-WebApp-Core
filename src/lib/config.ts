/**
 * src/lib/config.ts
 *
 * Unico punto di lettura delle variabili d'ambiente.
 * Tutti gli altri moduli importano da qui — mai da import.meta.env direttamente.
 *
 * Questo permette di:
 * - Cambiare nodi senza modificare il codice
 * - Avere fallback robusti se una variabile manca
 * - Validare la configurazione all'avvio
 */

// ── Nodi della rete ───────────────────────────────────────────────────────────

/** URL del nodo primario (letto dal .env, fallback su hashburst.io) */
export const NODE_PRIMARY: string =
  import.meta.env.VITE_HASHBURST_NODE_PRIMARY ??
  'https://hashburst.io/api';

/**
 * Lista completa dei nodi, in ordine di priorità.
 * Il client li prova in sequenza in caso di fallimento.
 */
export const NODE_LIST: string[] = (() => {
  const primary = NODE_PRIMARY;

  const fallbackEnv = import.meta.env.VITE_HASHBURST_NODES_FALLBACK ?? '';
  const fallbacks = fallbackEnv
    .split(',')
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0 && u !== primary);

  return [primary, ...fallbacks];
})();

// ── IPFS ─────────────────────────────────────────────────────────────────────

export const IPFS_GATEWAY: string =
  import.meta.env.VITE_IPFS_GATEWAY ?? 'https://hashburst.io/ipfs';

export const IPFS_API: string =
  import.meta.env.VITE_IPFS_API ?? 'https://hashburst.io/ipfs-api';

// ── HVM ──────────────────────────────────────────────────────────────────────

export const HVM_ENDPOINT: string =
  import.meta.env.VITE_HVM_ENDPOINT ?? 'https://hashburst.io/hvm';

// ── Rete ─────────────────────────────────────────────────────────────────────

export const CHAIN_ID: number =
  Number(import.meta.env.VITE_CHAIN_ID ?? 1337);

export const NETWORK_NAME: string =
  import.meta.env.VITE_NETWORK_NAME ?? 'HashBurst Mainnet';

// ── Timeout ───────────────────────────────────────────────────────────────────

export const NODE_TIMEOUT_MS: number =
  Number(import.meta.env.VITE_NODE_TIMEOUT_MS ?? 5000);

export const NODE_MAX_RETRIES: number =
  Number(import.meta.env.VITE_NODE_MAX_RETRIES ?? 3);

// ── Validazione all'avvio ─────────────────────────────────────────────────────

export function validateConfig(): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];

  for (const url of NODE_LIST) {
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      warnings.push(
        `ATTENZIONE: il nodo "${url}" usa HTTP. ` +
        `La Web Crypto API richiede HTTPS o localhost. ` +
        `Aggiorna VITE_HASHBURST_NODE_PRIMARY nel file .env.`
      );
    }
    const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    if (ipPattern.test(url)) {
      warnings.push(
        `CONSIGLIO: "${url}" usa un IP diretto. ` +
        `Preferisci un dominio (hashburst.io) per resistere ai cambi di IP.`
      );
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn('[HashBurst Config]', w));
  }

  return { ok: warnings.length === 0, warnings };
}

if (import.meta.env.DEV) {
  console.log('[HashBurst Config]', { NODE_PRIMARY, NODE_LIST, IPFS_GATEWAY, CHAIN_ID });
}
