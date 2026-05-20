/**
 * src/hooks/useWallets.ts
 *
 * Hook React che centralizza la gestione dello stato dei wallet.
 * Tutti i componenti che hanno bisogno dei wallet usano questo hook
 * invece di chiamare direttamente il service — garantisce consistenza.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllWallets,
  unlockWallet,
  createWallet,
  deleteWallet,
  renameWallet,
  updateBalance,
  type StoredWallet,
} from '../services/wallet';
import { hashburstClient } from '../services/hashburst';

export interface UnlockedWallet {
  walletId:      string;
  privateKeyHex: string;
  unlockedAt:    number;
}

interface UseWalletsReturn {
  wallets:        StoredWallet[];
  loading:        boolean;
  error:          string | null;
  activeWallet:   StoredWallet | null;
  unlockedKey:    UnlockedWallet | null;
  setActiveWallet: (w: StoredWallet | null) => void;
  reload:          () => Promise<void>;
  unlock:          (id: string, password: string) => Promise<string>;
  lock:            () => void;
  create:          (name: string, password: string) => Promise<{ wallet: StoredWallet; privateKeyHex: string }>;
  remove:          (id: string, password: string) => Promise<void>;
  rename:          (id: string, newName: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
}

// Auto-lock dopo N minuti di inattività (default: 15)
const AUTO_LOCK_MS = 15 * 60 * 1000;

export function useWallets(): UseWalletsReturn {
  const [wallets,      setWallets]      = useState<StoredWallet[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<StoredWallet | null>(null);
  const [unlockedKey,  setUnlockedKey]  = useState<UnlockedWallet | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auto-lock ────────────────────────────────────────────────────────────

  const resetLockTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setUnlockedKey(null);
    }, AUTO_LOCK_MS);
  }, []);

  useEffect(() => {
    // Riattiva il timer a ogni interazione utente
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => { if (unlockedKey) resetLockTimer(); };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [unlockedKey, resetLockTimer]);

  // ─── Carica wallet ────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ws = await getAllWallets();
      setWallets(ws);

      // Se il wallet attivo è stato eliminato, deselezionalo
      if (activeWallet && !ws.find(w => w.id === activeWallet.id)) {
        setActiveWallet(null);
        setUnlockedKey(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento wallet');
    } finally {
      setLoading(false);
    }
  }, [activeWallet]);

  useEffect(() => { reload(); }, []);

  // ─── Balance refresh in background ───────────────────────────────────────

  const refreshBalances = useCallback(async () => {
    const ws = await getAllWallets();
    await Promise.allSettled(
      ws.map(async (w) => {
        try {
          const { balance } = await hashburstClient.getBalance(w.address);
          await updateBalance(w.address, balance);
          setWallets(prev =>
            prev.map(p => p.id === w.id ? { ...p, balance } : p)
          );
        } catch {
          // Nodo offline — mantieni balance precedente
        }
      })
    );
  }, []);

  // Auto-refresh balance ogni 60 secondi
  useEffect(() => {
    const interval = setInterval(refreshBalances, 60_000);
    return () => clearInterval(interval);
  }, [refreshBalances]);

  // ─── Sblocco ──────────────────────────────────────────────────────────────

  const unlock = useCallback(async (id: string, password: string): Promise<string> => {
    const key = await unlockWallet(id, password);
    setUnlockedKey({ walletId: id, privateKeyHex: key, unlockedAt: Date.now() });
    resetLockTimer();
    return key;
  }, [resetLockTimer]);

  const lock = useCallback(() => {
    setUnlockedKey(null);
    if (lockTimer.current) clearTimeout(lockTimer.current);
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const create = useCallback(async (name: string, password: string) => {
    const result = await createWallet(name, password);
    await reload();
    return result;
  }, [reload]);

  const remove = useCallback(async (id: string, password: string) => {
    await unlockWallet(id, password); // verifica password prima
    await deleteWallet(id);
    if (activeWallet?.id === id) {
      setActiveWallet(null);
      setUnlockedKey(null);
    }
    await reload();
  }, [activeWallet, reload]);

  const rename = useCallback(async (id: string, newName: string) => {
    await renameWallet(id, newName);
    await reload();
  }, [reload]);

  return {
    wallets,
    loading,
    error,
    activeWallet,
    unlockedKey,
    setActiveWallet,
    reload,
    unlock,
    lock,
    create,
    remove,
    rename,
    refreshBalances,
  };
}
