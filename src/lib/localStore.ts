/**
 * src/lib/localStore.ts
 *
 * SOSTITUZIONE COMPLETA DI SUPABASE.
 *
 * Tutto viene salvato nell'IndexedDB del browser dell'utente,
 * che è persistente (sopravvive alla chiusura del browser),
 * locale (non esce mai dalla macchina), e disponibile su
 * tutti i browser moderni: Chrome, Firefox, Safari, Edge.
 *
 * Per i dati di rete (nodi, record blockchain, contratti) che
 * prima andavano su Supabase, usiamo due sorgenti:
 *   1. Il nodo HashBurst remoto (API REST su porta 8002/8003)
 *   2. Una cache locale in IndexedDB per funzionamento offline
 *
 * Le chiavi private NON escono mai dal browser.
 */

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  encryptedPrivateKey: string; // AES-GCM cifrato con password utente
  salt: string;                // salt per derivazione chiave
  iv: string;                  // IV per AES-GCM
  createdAt: string;
  balance?: number;
}

export interface BlockchainRecord {
  id: string;
  type: 'file' | 'event' | 'data' | 'contract';
  title: string;
  content: string;
  ipfsCid?: string;
  txHash?: string;
  timestamp: string;
  walletAddress: string;
}

export interface NetworkNode {
  id: string;
  url: string;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: string;
}

export interface AppSettings {
  nodeUrl: string;
  ipfsGateway: string;
  ipfsApi: string;
  theme: 'dark' | 'light';
  language: string;
  autoLockMinutes: number;
}

// ─── Costanti ────────────────────────────────────────────────────────────────

const DB_NAME    = 'hashburst_local';
const DB_VERSION = 1;

const STORES = {
  wallets:  'wallets',
  records:  'blockchain_records',
  settings: 'settings',
  cache:    'network_cache',
} as const;

// ─── Apertura DB ─────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.wallets)) {
        const ws = db.createObjectStore(STORES.wallets, { keyPath: 'id' });
        ws.createIndex('address', 'address', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.records)) {
        const rs = db.createObjectStore(STORES.records, { keyPath: 'id' });
        rs.createIndex('type',      'type');
        rs.createIndex('timestamp', 'timestamp');
        rs.createIndex('wallet',    'walletAddress');
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.cache)) {
        const cs = db.createObjectStore(STORES.cache, { keyPath: 'key' });
        cs.createIndex('expires', 'expires');
      }
    };

    req.onsuccess  = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Helper generico per transazioni ─────────────────────────────────────────

async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db   = await openDB();
  const t    = db.transaction(storeName, mode);
  const store = t.objectStore(storeName);
  return new Promise((resolve, reject) => {
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function txAll<T>(
  storeName: string,
  indexName?: string,
  query?: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db   = await openDB();
  const t    = db.transaction(storeName, 'readonly');
  const store = t.objectStore(storeName);
  const source = indexName ? store.index(indexName) : store;
  return new Promise((resolve, reject) => {
    const req = query ? (source as IDBIndex).getAll(query) : source.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror   = () => reject(req.error);
  });
}

// ─── API Wallet ───────────────────────────────────────────────────────────────

export const walletStore = {

  async getAll(): Promise<StoredWallet[]> {
    return txAll<StoredWallet>(STORES.wallets);
  },

  async getById(id: string): Promise<StoredWallet | undefined> {
    return tx<StoredWallet | undefined>(STORES.wallets, 'readonly',
      (s) => s.get(id));
  },

  async getByAddress(address: string): Promise<StoredWallet | undefined> {
    const db    = await openDB();
    const t     = db.transaction(STORES.wallets, 'readonly');
    const index = t.objectStore(STORES.wallets).index('address');
    return new Promise((resolve, reject) => {
      const req = index.get(address);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },

  async save(wallet: StoredWallet): Promise<void> {
    await tx<IDBValidKey>(STORES.wallets, 'readwrite', (s) => s.put(wallet));
  },

  async delete(id: string): Promise<void> {
    await tx<undefined>(STORES.wallets, 'readwrite', (s) => s.delete(id));
  },

  async count(): Promise<number> {
    return tx<number>(STORES.wallets, 'readonly', (s) => s.count());
  },
};

// ─── API Record Blockchain ────────────────────────────────────────────────────

export const recordStore = {

  async getAll(): Promise<BlockchainRecord[]> {
    const all = await txAll<BlockchainRecord>(STORES.records);
    return all.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getByType(type: BlockchainRecord['type']): Promise<BlockchainRecord[]> {
    return txAll<BlockchainRecord>(STORES.records, 'type', type);
  },

  async save(record: BlockchainRecord): Promise<void> {
    await tx<IDBValidKey>(STORES.records, 'readwrite', (s) => s.put(record));
  },

  async delete(id: string): Promise<void> {
    await tx<undefined>(STORES.records, 'readwrite', (s) => s.delete(id));
  },
};

// ─── API Settings ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  nodeUrl:          'http://31.25.11.195:8002',
  ipfsGateway:      'http://31.25.11.195:8080/ipfs',
  ipfsApi:          'http://31.25.11.195:5001',
  theme:            'dark',
  language:         'it',
  autoLockMinutes:  15,
};

export const settingsStore = {

  async get(): Promise<AppSettings> {
    const db = await openDB();
    const t  = db.transaction(STORES.settings, 'readonly');
    const s  = t.objectStore(STORES.settings);
    return new Promise((resolve) => {
      const req = s.get('app');
      req.onsuccess = () =>
        resolve(req.result ? req.result.value : DEFAULT_SETTINGS);
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  },

  async save(settings: Partial<AppSettings>): Promise<void> {
    const current = await settingsStore.get();
    const merged  = { ...current, ...settings };
    await tx<IDBValidKey>(STORES.settings, 'readwrite',
      (s) => s.put({ key: 'app', value: merged }));
  },

  async reset(): Promise<void> {
    await tx<IDBValidKey>(STORES.settings, 'readwrite',
      (s) => s.put({ key: 'app', value: DEFAULT_SETTINGS }));
  },
};

// ─── Cache di rete ────────────────────────────────────────────────────────────

export const networkCache = {

  async set(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;
    await tx<IDBValidKey>(STORES.cache, 'readwrite',
      (s) => s.put({ key, value, expires }));
  },

  async get<T>(key: string): Promise<T | null> {
    const db = await openDB();
    const t  = db.transaction(STORES.cache, 'readonly');
    const s  = t.objectStore(STORES.cache);
    return new Promise((resolve) => {
      const req = s.get(key);
      req.onsuccess = () => {
        const row = req.result;
        if (!row || Date.now() > row.expires) {
          resolve(null);
        } else {
          resolve(row.value as T);
        }
      };
      req.onerror = () => resolve(null);
    });
  },

  /** Pulizia chiavi scadute — da chiamare all'avvio */
  async purgeExpired(): Promise<void> {
    const db    = await openDB();
    const t     = db.transaction(STORES.cache, 'readwrite');
    const store = t.objectStore(STORES.cache);
    const index = store.index('expires');
    const range = IDBKeyRange.upperBound(Date.now());
    const req   = index.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  },
};

// ─── Esportazione / Importazione dati (backup) ────────────────────────────────

export async function exportAllData(): Promise<string> {
  const [wallets, records, settings] = await Promise.all([
    walletStore.getAll(),
    recordStore.getAll(),
    settingsStore.get(),
  ]);
  // Le chiavi private sono già cifrate — sicuro esportarle
  const payload = {
    version:   1,
    exportedAt: new Date().toISOString(),
    wallets,
    records,
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  if (data.version !== 1) throw new Error('Formato backup non riconosciuto');
  for (const w of data.wallets  ?? []) await walletStore.save(w);
  for (const r of data.records  ?? []) await recordStore.save(r);
  if (data.settings) await settingsStore.save(data.settings);
}
