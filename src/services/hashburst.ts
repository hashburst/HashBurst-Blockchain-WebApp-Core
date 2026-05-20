/**
 * src/services/hashburst.ts  — versione aggiornata
 *
 * Usa config.ts come unica sorgente degli URL.
 * Failover automatico tra tutti i nodi in NODE_LIST.
 * Cache locale IndexedDB per funzionamento degradato offline.
 */

import { networkCache } from '../lib/localStore';
import {
  NODE_LIST,
  IPFS_GATEWAY,
  IPFS_API,
  NODE_TIMEOUT_MS,
  NODE_MAX_RETRIES,
} from '../lib/config';

// ── Tipi risposta nodo ────────────────────────────────────────────────────────

export interface NodeStatus {
  status:      'online' | 'offline';
  blockHeight: number;
  peers:       number;
  version:     string;
  chainId:     number;
  tps:         number;
  nodeId:      string;
}

export interface Block {
  number:       number;
  hash:         string;
  parentHash:   string;
  timestamp:    number;
  transactions: number;
  miner:        string;
  size:         number;
}

export interface Transaction {
  hash:        string;
  from:        string;
  to:          string;
  value:       string;
  blockNumber: number;
  timestamp:   number;
  status:      'success' | 'failed' | 'pending';
  gasUsed:     number;
}

export interface WalletBalance {
  address: string;
  balance: number;
  symbol:  string;
  txCount: number;
}

// ── Client con failover su NODE_LIST ─────────────────────────────────────────

class HashBurstClient {

  private async fetchWithFailover<T>(
    path: string,
    options?: RequestInit,
    cacheKey?: string,
    cacheTtl = 10
  ): Promise<T> {

    // Cache locale prima di fare rete
    if (cacheKey && !options?.method) {
      const cached = await networkCache.get<T>(cacheKey);
      if (cached !== null) return cached;
    }

    let lastError: Error | null = null;

    for (const baseUrl of NODE_LIST) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
          },
          signal: AbortSignal.timeout(NODE_TIMEOUT_MS),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json() as T;

        if (cacheKey) {
          await networkCache.set(cacheKey, data, cacheTtl);
          // Salva anche versione stale (usata se tutti i nodi sono giù)
          await networkCache.set(cacheKey + '_stale', data, cacheTtl * 100);
        }

        return data;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    // Tutti i nodi offline — usa cache stale
    if (cacheKey) {
      const stale = await networkCache.get<T>(cacheKey + '_stale');
      if (stale !== null) {
        console.warn('[HashBurst] Tutti i nodi offline — uso cache stale:', cacheKey);
        return stale;
      }
    }

    throw lastError ?? new Error('Tutti i nodi HashBurst non raggiungibili');
  }

  // ── Status ───────────────────────────────────────────────────────────────────

  async getStatus(): Promise<NodeStatus> {
    return this.fetchWithFailover<NodeStatus>('/status', undefined, 'node_status', 15);
  }

  // ── Blocks ───────────────────────────────────────────────────────────────────

  async getBlocks(limit = 10): Promise<Block[]> {
    return this.fetchWithFailover<Block[]>(
      `/blocks?limit=${limit}`, undefined, `blocks_${limit}`, 5
    );
  }

  async getBlockByNumber(n: number): Promise<Block> {
    return this.fetchWithFailover<Block>(`/blocks/${n}`, undefined, `block_${n}`, 3600);
  }

  // ── Transactions ─────────────────────────────────────────────────────────────

  async getTransactions(limit = 20): Promise<Transaction[]> {
    return this.fetchWithFailover<Transaction[]>(
      `/transactions?limit=${limit}`, undefined, `txs_${limit}`, 5
    );
  }

  async getTransaction(hash: string): Promise<Transaction> {
    return this.fetchWithFailover<Transaction>(
      `/transactions/${hash}`, undefined, `tx_${hash}`, 3600
    );
  }

  async getWalletTransactions(address: string, limit = 50): Promise<Transaction[]> {
    return this.fetchWithFailover<Transaction[]>(
      `/wallets/${address}/transactions?limit=${limit}`,
      undefined,
      `wallet_txs_${address}`,
      10
    );
  }

  // ── Balance ──────────────────────────────────────────────────────────────────

  async getBalance(address: string): Promise<WalletBalance> {
    return this.fetchWithFailover<WalletBalance>(
      `/wallets/${address}/balance`, undefined, `balance_${address}`, 15
    );
  }

  // ── Broadcast transazione ────────────────────────────────────────────────────

  async sendTransaction(signedTx: Record<string, unknown>): Promise<{ txHash: string }> {
    return this.fetchWithFailover<{ txHash: string }>('/transactions', {
      method: 'POST',
      body:   JSON.stringify(signedTx),
    });
  }

  // ── IPFS ─────────────────────────────────────────────────────────────────────

  async uploadToIPFS(file: File): Promise<{ cid: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${IPFS_API}/api/v0/add`, {
      method: 'POST',
      body:   formData,
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) throw new Error('Upload IPFS fallito');
    const data = await res.json();
    return {
      cid: data.Hash,
      url: `${IPFS_GATEWAY}/${data.Hash}`,
    };
  }

  // ── Health check di tutti i nodi ─────────────────────────────────────────────

  async checkAllNodes(): Promise<Array<{ url: string; online: boolean; latencyMs?: number }>> {
    return Promise.all(
      NODE_LIST.map(async (url) => {
        const t0 = Date.now();
        try {
          const res = await fetch(`${url}/status`, {
            signal: AbortSignal.timeout(3000),
          });
          return { url, online: res.ok, latencyMs: Date.now() - t0 };
        } catch {
          return { url, online: false };
        }
      })
    );
  }
}

export const hashburstClient = new HashBurstClient();
