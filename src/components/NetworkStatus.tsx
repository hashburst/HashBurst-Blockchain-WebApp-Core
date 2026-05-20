/**
 * src/components/NetworkStatus.tsx
 *
 * Dashboard di stato della rete — versione senza Supabase.
 * Legge direttamente dal nodo HashBurst tramite hashburstClient.
 */

import React from 'react';
import { useNetwork } from '../hooks/useNetwork';

export function NetworkStatus() {
  const { status, blocks, transactions, loading, error, isOnline, lastUpdated, refresh } = useNetwork();

  const fmt = (n?: number) => n?.toLocaleString('it-IT') ?? '—';
  const fmtTime = (ts?: number) =>
    ts ? new Date(ts * 1000).toLocaleTimeString('it-IT') : '—';

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#2E86C1' }}>📡 Stato Rete HashBurst</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: isOnline ? '#2ECC71' : '#E74C3C', fontSize: '13px'
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isOnline ? '#2ECC71' : '#E74C3C',
              boxShadow: isOnline ? '0 0 6px #2ECC71' : 'none',
              display: 'inline-block'
            }} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {lastUpdated && (
            <span style={{ color: '#808B96', fontSize: '12px' }}>
              Aggiornato: {lastUpdated.toLocaleTimeString('it-IT')}
            </span>
          )}
          <button onClick={refresh}
            style={{ background: '#2E86C1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Errore rete */}
      {error && !loading && (
        <div style={{ background: '#e74c3c22', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error} — mostro dati dalla cache locale
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ color: '#808B96', marginBottom: 16 }}>Connessione ai nodi...</div>
      )}

      {/* KPI Cards */}
      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Block Height',  value: fmt(status.blockHeight), icon: '🧱' },
            { label: 'Peers',         value: fmt(status.peers),       icon: '🔗' },
            { label: 'TPS',           value: fmt(status.tps),         icon: '⚡' },
            { label: 'Chain ID',      value: String(status.chainId),  icon: '🔑' },
            { label: 'Versione',      value: status.version,          icon: '📦' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ color: '#2E86C1', fontSize: 22, fontWeight: 'bold', margin: '4px 0' }}>{value}</div>
              <div style={{ color: '#808B96', fontSize: 11 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ultimi blocchi */}
      {blocks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#2E86C1', marginBottom: '10px' }}>🧱 Ultimi Blocchi</h3>
          <div style={{ background: '#1A2634', borderRadius: 8, overflow: 'hidden', border: '1px solid #2C3E50' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#0D1117' }}>
                  {['#','Hash','Miner','TX','Ora'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#2E86C1', textAlign: 'left', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map((b, i) => (
                  <tr key={b.hash} style={{ borderTop: '1px solid #2C3E50', background: i % 2 === 0 ? 'transparent' : '#0D111766' }}>
                    <td style={{ padding: '8px 12px', color: '#2ECC71' }}>{fmt(b.number)}</td>
                    <td style={{ padding: '8px 12px', color: '#AED6F1', fontFamily: 'monospace' }}>{b.hash.slice(0, 12)}...</td>
                    <td style={{ padding: '8px 12px', color: '#F39C12', fontFamily: 'monospace' }}>{b.miner.slice(0, 10)}...</td>
                    <td style={{ padding: '8px 12px', color: '#ECF0F1' }}>{fmt(b.transactions)}</td>
                    <td style={{ padding: '8px 12px', color: '#808B96' }}>{fmtTime(b.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ultime transazioni */}
      {transactions.length > 0 && (
        <div>
          <h3 style={{ color: '#2E86C1', marginBottom: '10px' }}>💸 Ultime Transazioni</h3>
          <div style={{ background: '#1A2634', borderRadius: 8, overflow: 'hidden', border: '1px solid #2C3E50' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#0D1117' }}>
                  {['Hash','Da','A','Valore','Stato'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#2E86C1', textAlign: 'left', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx, i) => (
                  <tr key={tx.hash} style={{ borderTop: '1px solid #2C3E50', background: i % 2 === 0 ? 'transparent' : '#0D111766' }}>
                    <td style={{ padding: '8px 12px', color: '#AED6F1', fontFamily: 'monospace' }}>{tx.hash.slice(0, 10)}...</td>
                    <td style={{ padding: '8px 12px', color: '#F39C12', fontFamily: 'monospace' }}>{tx.from.slice(0, 10)}...</td>
                    <td style={{ padding: '8px 12px', color: '#2ECC71', fontFamily: 'monospace' }}>{tx.to.slice(0, 10)}...</td>
                    <td style={{ padding: '8px 12px', color: '#ECF0F1' }}>{tx.value} HBT</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        color: tx.status === 'success' ? '#2ECC71' : tx.status === 'pending' ? '#F39C12' : '#E74C3C',
                        fontSize: 11
                      }}>
                        {tx.status === 'success' ? '✅' : tx.status === 'pending' ? '⏳' : '❌'} {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota sicurezza */}
      <div style={{ marginTop: 20, padding: '10px 14px', background: '#1A3A5C44', borderRadius: 6, fontSize: 12, color: '#7FB3D3' }}>
        🔒 I dati della rete vengono letti direttamente dai nodi HashBurst.
        Nessun intermediario cloud. La cache locale garantisce visualizzazione
        anche in caso di disconnessione temporanea.
      </div>
    </div>
  );
}

export default NetworkStatus;
