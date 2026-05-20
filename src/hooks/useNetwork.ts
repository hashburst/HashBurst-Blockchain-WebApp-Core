/**
 * src/hooks/useNetwork.ts
 *
 * Hook React per lo stato della rete HashBurst.
 * Polling automatico con cache locale — funziona anche offline
 * ritornando gli ultimi dati validi dalla cache IndexedDB.
 */

import { useState, useEffect, useCallback } from 'react';
import { hashburstClient, type NodeStatus, type Block, type Transaction } from '../services/hashburst';

interface UseNetworkReturn {
  status:        NodeStatus | null;
  blocks:        Block[];
  transactions:  Transaction[];
  loading:       boolean;
  error:         string | null;
  isOnline:      boolean;
  lastUpdated:   Date | null;
  refresh:       () => Promise<void>;
}

export function useNetwork(pollIntervalMs = 15_000): UseNetworkReturn {
  const [status,       setStatus]       = useState<NodeStatus | null>(null);
  const [blocks,       setBlocks]       = useState<Block[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [isOnline,     setIsOnline]     = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Fetch in parallelo per minimizzare latenza
      const [st, bls, txs] = await Promise.all([
        hashburstClient.getStatus(),
        hashburstClient.getBlocks(10),
        hashburstClient.getTransactions(20),
      ]);
      setStatus(st);
      setBlocks(bls);
      setTransactions(txs);
      setIsOnline(true);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setIsOnline(false);
      const msg = e instanceof Error ? e.message : 'Rete non raggiungibile';
      setError(msg);
      // Non azzera i dati precedenti — mostra cache stale
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return {
    status, blocks, transactions,
    loading, error, isOnline, lastUpdated,
    refresh,
  };
}
