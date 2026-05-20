/**
 * src/components/Settings.tsx
 *
 * Impostazioni locali — nessun Supabase.
 * Include backup/restore completo, impostazioni nodo, e diagnostica.
 */

import React, { useState, useEffect } from 'react';
import { settingsStore, exportAllData, importData, type AppSettings } from '../lib/localStore';
import { hashburstClient } from '../services/hashburst';

export function Settings() {

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [nodeStatus, setNodeStatus] = useState<Array<{ url: string; online: boolean; latencyMs?: number }>>([]);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    settingsStore.get().then(setSettings);
  }, []);

  const save = async () => {
    if (!settings) return;
    await settingsStore.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testNodes = async () => {
    setTesting(true);
    try {
      const results = await hashburstClient.checkAllNodes();
      setNodeStatus(results);
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `hashburst-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Errore esportazione dati');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await importData(await f.text());
      window.location.reload();
    } catch (err) {
      setError('File backup non valido');
    }
  };

  const handleReset = () => {
    if (!confirm('Sei sicuro? Eliminerà tutti i wallet e le impostazioni dal browser.')) return;
    indexedDB.deleteDatabase('hashburst_local');
    window.location.reload();
  };

  if (!settings) return <p style={{ color: '#AED6F1', padding: 20 }}>Caricamento...</p>;

  const field = (label: string, key: keyof AppSettings) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#AED6F1', fontSize: 13, marginBottom: 4 }}>{label}</label>
      <input
        value={String(settings[key])}
        onChange={e => setSettings(s => s ? { ...s, [key]: e.target.value } : s)}
        style={{ width: '100%', boxSizing: 'border-box', background: '#0D1117', border: '1px solid #2E86C1', borderRadius: 4, padding: '8px 10px', color: '#ECF0F1', fontFamily: 'monospace', fontSize: 14 }}
      />
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 700 }}>
      <h2 style={{ color: '#2E86C1' }}>⚙️ Impostazioni Locali</h2>

      {error && <div style={{ background: '#e74c3c22', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ background: '#27ae6022', border: '1px solid #27ae60', color: '#27ae60', padding: '10px', borderRadius: 6, marginBottom: 12 }}>✓ Salvato</div>}

      <section style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ color: '#2E86C1', marginTop: 0 }}>🌐 Configurazione Nodo</h3>
        {field('URL Nodo Primario', 'nodeUrl')}
        {field('IPFS Gateway', 'ipfsGateway')}
        {field('IPFS API', 'ipfsApi')}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={save} style={btn('#27AE60')}>💾 Salva</button>
          <button onClick={testNodes} disabled={testing} style={btn('#2E86C1')}>
            {testing ? '...' : '🔌 Test connessione'}
          </button>
        </div>
        {nodeStatus.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {nodeStatus.map(n => (
              <div key={n.url} style={{ fontSize: 12, color: n.online ? '#2ECC71' : '#E74C3C', marginBottom: 4 }}>
                {n.online ? '✅' : '❌'} {n.url} {n.latencyMs ? `(${n.latencyMs}ms)` : ''}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ color: '#2E86C1', marginTop: 0 }}>💾 Backup & Restore</h3>
        <p style={{ color: '#AED6F1', fontSize: 13 }}>
          Esporta un backup di tutti i wallet (cifrati) e le impostazioni.
          Nessun dato va in rete — il file rimane sul tuo computer.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={btn('#8E44AD')}>📤 Esporta backup</button>
          <label style={{ ...btn('#1F6AA5'), cursor: 'pointer' }}>
            📥 Importa backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </section>

      <section style={{ background: '#2C1810', border: '1px solid #E74C3C', borderRadius: 8, padding: 16 }}>
        <h3 style={{ color: '#E74C3C', marginTop: 0 }}>⚠️ Zona Pericolosa</h3>
        <p style={{ color: '#E59866', fontSize: 13 }}>
          Questa operazione elimina tutti i dati locali (wallet, impostazioni, cache).
          I fondi sulla blockchain non vengono toccati, ma perderai l'accesso
          se non hai il backup delle chiavi private.
        </p>
        <button onClick={handleReset} style={btn('#E74C3C')}>🗑️ Reset completo dati locali</button>
      </section>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return { background: bg, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 5, cursor: 'pointer', fontFamily: 'monospace', fontSize: 13 };
}

export default Settings;
