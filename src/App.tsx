/**
 * src/App.tsx
 *
 * App principale HashBurst — versione local-first senza Supabase.
 *
 * Provider hierarchy:
 *   App
 *   └── useWallets hook (stato wallet condiviso)
 *       ├── NetworkStatus  (dati blockchain in tempo reale)
 *       ├── WalletManager  (gestione chiavi locale)
 *       ├── NodeSetup      (installazione nodo)
 *       ├── FileUpload     (upload IPFS)
 *       ├── RecordsViewer  (record blockchain)
 *       ├── SmartContracts (deploy contratti)
 *       ├── P2PNetwork     (monitoraggio rete)
 *       └── Settings       (configurazione locale)
 */

import React, { useState, useEffect } from 'react';
import { WalletManager }  from './components/WalletManager';
import { NetworkStatus }  from './components/NetworkStatus';
import { Settings }       from './components/Settings';
import { useWallets }     from './hooks/useWallets';
import { openDB, networkCache } from './lib/localStore';

// ─── Tab Definition ───────────────────────────────────────────────────────────

type Tab =
  | 'dashboard'
  | 'wallet'
  | 'node'
  | 'upload'
  | 'records'
  | 'contracts'
  | 'network'
  | 'settings';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard',      icon: '📊' },
  { id: 'wallet',    label: 'Wallet',          icon: '🔐' },
  { id: 'node',      label: 'Nodo',            icon: '⚙️' },
  { id: 'upload',    label: 'Upload IPFS',     icon: '📁' },
  { id: 'records',   label: 'Record',          icon: '📋' },
  { id: 'contracts', label: 'Smart Contracts', icon: '📜' },
  { id: 'network',   label: 'Rete P2P',        icon: '🌐' },
  { id: 'settings',  label: 'Impostazioni',    icon: '⚙️' },
];

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,     setTab]    = useState<Tab>('dashboard');
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState('');

  const walletCtx = useWallets();

  // Inizializza DB al mount
  useEffect(() => {
    openDB()
      .then(() => {
        networkCache.purgeExpired();
        setDbReady(true);
      })
      .catch(e => {
        setDbError(`Impossibile aprire il database locale: ${e.message}`);
      });
  }, []);

  if (dbError) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#E74C3C' }}>
        <h2>❌ Errore Database Locale</h2>
        <p>{dbError}</p>
        <p>Possibili cause: modalità privata/incognito (IndexedDB disabilitato), storage pieno, o browser molto vecchio.</p>
        <p>Soluzione: apri in una finestra normale del browser.</p>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#AED6F1' }}>
        Inizializzazione database locale...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#ECF0F1', fontFamily: 'monospace' }}>

      {/* Header */}
      <header style={{ background: '#1A2634', borderBottom: '2px solid #2E86C1', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#2E86C1', fontWeight: 'bold', fontSize: 20 }}>⛓ HashBurst</span>
          <span style={{ color: '#5D6D7E', fontSize: 12, marginLeft: 12 }}>Blockchain Platform — Local-First</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {walletCtx.activeWallet && (
            <div style={{ background: '#0D1117', border: '1px solid #2E86C1', borderRadius: 6, padding: '6px 12px', fontSize: 12 }}>
              <span style={{ color: '#808B96' }}>Wallet: </span>
              <span style={{ color: '#2ECC71' }}>{walletCtx.activeWallet.name}</span>
              <span style={{ color: '#808B96', marginLeft: 8 }}>
                {walletCtx.activeWallet.balance?.toFixed(4) ?? '—'} HBT
              </span>
              {walletCtx.unlockedKey && (
                <span style={{ color: '#F39C12', marginLeft: 8 }}>🔓</span>
              )}
            </div>
          )}
          {walletCtx.unlockedKey && (
            <button onClick={walletCtx.lock}
              style={{ background: '#E74C3C', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>
              🔒 Blocca
            </button>
          )}
        </div>
      </header>

      {/* Avviso wallet non selezionato */}
      {!walletCtx.activeWallet && tab !== 'wallet' && tab !== 'settings' && tab !== 'dashboard' && (
        <div style={{ background: '#F39C1222', border: '1px solid #F39C12', color: '#F39C12', padding: '10px 24px', fontSize: 13 }}>
          ⚠️ Nessun wallet selezionato.{' '}
          <button onClick={() => setTab('wallet')}
            style={{ background: 'none', border: 'none', color: '#F39C12', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'monospace' }}>
            Vai al Wallet Manager
          </button>
          {' '}per creare o selezionare un wallet.
        </div>
      )}

      {/* Navigation */}
      <nav style={{ background: '#161B22', borderBottom: '1px solid #2C3E50', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background:   tab === t.id ? '#1A2634' : 'transparent',
              color:        tab === t.id ? '#2E86C1' : '#808B96',
              border:       'none',
              borderBottom: tab === t.id ? '2px solid #2E86C1' : '2px solid transparent',
              padding:      '12px 18px',
              cursor:       'pointer',
              fontFamily:   'monospace',
              fontSize:     13,
              whiteSpace:   'nowrap',
              transition:   'color .2s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '0' }}>
        {tab === 'dashboard' && (
          <div>
            <NetworkStatus />
            {walletCtx.wallets.length === 0 && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ background: '#1A3A5C', border: '1px solid #2E86C1', borderRadius: 8, padding: 20, maxWidth: 600 }}>
                  <h3 style={{ color: '#2E86C1', marginTop: 0 }}>🚀 Benvenuto in HashBurst</h3>
                  <p style={{ color: '#AED6F1', fontSize: 14 }}>
                    Per iniziare, crea il tuo primo wallet locale.
                    Le chiavi private rimangono solo sul tuo computer,
                    cifrate con la tua password.
                  </p>
                  <button onClick={() => setTab('wallet')}
                    style={{ background: '#27AE60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 14 }}>
                    🔐 Crea Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'wallet' && (
          <WalletManager onWalletSelect={walletCtx.setActiveWallet} />
        )}

        {tab === 'network' && <NetworkStatus />}

        {tab === 'settings' && <Settings />}

        {/* Placeholder per tab ancora da migrare */}
        {['node', 'upload', 'records', 'contracts'].includes(tab) && (
          <PlaceholderTab
            tab={tab}
            activeWallet={walletCtx.activeWallet}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2C3E50', padding: '12px 24px', color: '#5D6D7E', fontSize: 11, display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
        <span>HashBurst Blockchain Platform v2.0 — Local-First</span>
        <span>🔒 Chiavi private locali · No cloud · No Supabase</span>
      </footer>
    </div>
  );
}

// ─── Placeholder per i tab da completare ──────────────────────────────────────

function PlaceholderTab({
  tab,
  activeWallet,
}: {
  tab: string;
  activeWallet: { address: string; name: string } | null;
}) {
  const descriptions: Record<string, { title: string; desc: string; note: string }> = {
    node: {
      title: '⚙️ Setup Nodo',
      desc:  'Scarica e configura un nodo HashBurst locale per partecipare alla rete.',
      note:  'Questo tab si connette direttamente al nodo tramite API REST. Nessun Supabase richiesto.',
    },
    upload: {
      title: '📁 Upload IPFS',
      desc:  'Carica file sulla rete IPFS distribuita e crea record immutabili sulla blockchain.',
      note:  'Upload diretto al nodo IPFS (porta 5001). I record vengono salvati localmente in IndexedDB.',
    },
    records: {
      title: '📋 Record Blockchain',
      desc:  'Visualizza tutti i record pubblici sulla blockchain HashBurst.',
      note:  'I record vengono letti dal nodo tramite API REST e cached localmente.',
    },
    contracts: {
      title: '📜 Smart Contracts',
      desc:  'Deploya e interagisci con smart contract HBT-20 e HBT-721.',
      note:  'Deploy tramite HVM Framework su porta 8181. Firma con chiave privata locale.',
    },
  };

  const info = descriptions[tab] ?? { title: tab, desc: '', note: '' };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: 8, padding: 24, maxWidth: 600 }}>
        <h3 style={{ color: '#2E86C1', marginTop: 0 }}>{info.title}</h3>
        <p style={{ color: '#AED6F1' }}>{info.desc}</p>
        {activeWallet && (
          <p style={{ color: '#2ECC71', fontSize: 13 }}>
            ✅ Wallet attivo: <strong>{activeWallet.name}</strong>
            <br />
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{activeWallet.address}</span>
          </p>
        )}
        <div style={{ background: '#0D1117', border: '1px solid #2E86C1', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#7FB3D3', marginTop: 16 }}>
          🔧 Nota tecnica: {info.note}
        </div>
        <p style={{ color: '#808B96', fontSize: 12, marginTop: 12 }}>
          Questo tab è in fase di migrazione dal codice originale.
          La struttura e il service layer sottostante sono già pronti.
        </p>
      </div>
    </div>
  );
}
