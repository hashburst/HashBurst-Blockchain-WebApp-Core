/**
 * src/lib/browserCheck.ts
 *
 * Verifica a runtime che tutte le API del browser necessarie
 * siano disponibili. Da chiamare all'avvio dell'app.
 *
 * Se una feature manca, mostra un messaggio chiaro all'utente
 * invece di un crash cryptico.
 */

export interface BrowserCapabilities {
  indexedDB:      boolean;
  webCrypto:      boolean;
  webCryptoSubtle: boolean;
  es2020:         boolean;
  fetch:          boolean;
  abortController: boolean;
  localStorage:   boolean; // non usato per chiavi, ma per preferenze semplici
  overall:        boolean;
  issues:         string[];
}

export function checkBrowserCapabilities(): BrowserCapabilities {
  const issues: string[] = [];

  const indexedDB = typeof window !== 'undefined' && 'indexedDB' in window &&
    window.indexedDB !== null;
  if (!indexedDB)
    issues.push('IndexedDB non disponibile — il browser potrebbe essere in modalità privata o troppo vecchio');

  const webCrypto = typeof window !== 'undefined' && 'crypto' in window &&
    typeof window.crypto.getRandomValues === 'function';
  if (!webCrypto)
    issues.push('Web Crypto API (getRandomValues) non disponibile');

  const webCryptoSubtle = typeof window !== 'undefined' && 'crypto' in window &&
    'subtle' in window.crypto;
  if (!webCryptoSubtle)
    issues.push('Web Crypto API (subtle) non disponibile — richiede HTTPS o localhost');

  const es2020 = typeof Promise?.allSettled === 'function' &&
    typeof globalThis !== 'undefined' &&
    typeof Array.prototype.flat === 'function';
  if (!es2020)
    issues.push('Browser troppo vecchio — aggiorna a Chrome 80+, Firefox 75+, Safari 13+');

  const fetchAvail = typeof fetch === 'function';
  if (!fetchAvail)
    issues.push('fetch API non disponibile');

  const abortController = typeof AbortController !== 'undefined' &&
    'timeout' in AbortSignal;
  if (!abortController)
    issues.push('AbortSignal.timeout non disponibile (Chrome 103+, Firefox 100+)');

  const localStorageAvail = (() => {
    try { localStorage.setItem('_hb_test', '1'); localStorage.removeItem('_hb_test'); return true; }
    catch { return false; }
  })();

  const overall = indexedDB && webCrypto && webCryptoSubtle && es2020 && fetchAvail;

  return {
    indexedDB, webCrypto, webCryptoSubtle, es2020,
    fetch: fetchAvail, abortController,
    localStorage: localStorageAvail,
    overall, issues,
  };
}

/**
 * Nota su Web Crypto API e HTTPS:
 *
 * La Web Crypto API (window.crypto.subtle) funziona SOLO su:
 * - localhost (qualsiasi porta)
 * - origini HTTPS
 *
 * NON funziona su HTTP non-localhost (es. http://31.25.11.195:3000).
 *
 * Soluzione per deploy su server remoto: usare HTTPS con certificato
 * (Let's Encrypt è gratuito) oppure servire tramite nginx con SSL.
 *
 * Per sviluppo locale: npm run dev → http://localhost:5173 ✅
 */
export const CRYPTO_HTTPS_NOTE = `
La crittografia locale (AES-256-GCM) richiede un'origine sicura:
• http://localhost:PORT  ✅ (sviluppo locale)
• https://tuodominio.it  ✅ (produzione con HTTPS)  
• http://IP:PORT         ❌ (non funziona per la crittografia)

Per abilitare HTTPS sul server: configura nginx come reverse proxy
con certificato Let's Encrypt (vedere DEPLOYMENT.md).
`;

/**
 * Controlla se siamo su un'origine sicura per la crittografia.
 */
export function isSecureOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  return protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';
}
