/**
 * src/components/WalletManager.tsx
 *
 * Gestione wallet completamente locale.
 * Le chiavi private non escono mai dal browser.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  createWallet,
  getAllWallets,
  deleteWallet,
  renameWallet,
  unlockWallet,
  exportWalletToFile,
  importWalletFromFile,
  changePassword,
  checkPasswordStrength,
  type StoredWallet,
} from '../services/wallet';
import { hashburstClient } from '../services/hashburst';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

interface WalletManagerProps {
  onWalletSelect?: (wallet: StoredWallet) => void;
}

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'import_key' }
  | { type: 'import_file' }
  | { type: 'unlock';    walletId: string }
  | { type: 'delete';    wallet: StoredWallet }
  | { type: 'rename';    wallet: StoredWallet }
  | { type: 'export';    wallet: StoredWallet }
  | { type: 'change_pwd'; walletId: string }
  | { type: 'show_key';  privateKey: string; address: string };

// ─── Componente ───────────────────────────────────────────────────────────────

export function WalletManager({ onWalletSelect }: WalletManagerProps) {

  const [wallets,       setWallets]       = useState<StoredWallet[]>([]);
  const [modal,         setModal]         = useState<Modal>({ type: 'none' });
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  // Campi form
  const [name,          setName]          = useState('');
  const [password,      setPassword]      = useState('');
  const [password2,     setPassword2]     = useState('');
  const [oldPassword,   setOldPassword]   = useState('');
  const [privateKeyIn,  setPrivateKeyIn]  = useState('');
  const [fileContent,   setFileContent]   = useState('');
  const [newName,       setNewName]       = useState('');

  const reset = () => {
    setError(''); setSuccess(''); setName(''); setPassword('');
    setPassword2(''); setOldPassword(''); setPrivateKeyIn('');
    setFileContent(''); setNewName('');
  };

  const close = () => { setModal({ type: 'none' }); reset(); };

  const load = useCallback(async () => {
    const ws = await getAllWallets();
    setWallets(ws);
    // Aggiorna i balance in background
    ws.forEach(async (w) => {
      try {
        const bal = await hashburstClient.getBalance(w.address);
        setWallets(prev => prev.map(p =>
          p.id === w.id ? { ...p, balance: bal.balance } : p
        ));
      } catch { /* nodo offline — usa cache */ }
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // ─── Azioni ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!name.trim()) return setError('Inserisci un nome per il wallet');
    if (password !== password2) return setError('Le password non coincidono');
    setLoading(true);
    try {
      const { wallet, privateKeyHex } = await createWallet(name, password);
      await load();
      close();
      setModal({ type: 'show_key', privateKey: privateKeyHex, address: wallet.address });
      showMsg('Wallet creato! Salva la chiave privata in un posto sicuro.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore creazione');
    } finally { setLoading(false); }
  };

  const handleUnlock = async (walletId: string) => {
    setLoading(true);
    try {
      const key = await unlockWallet(walletId, password);
      const wallet = wallets.find(w => w.id === walletId)!;
      close();
      setModal({ type: 'show_key', privateKey: key, address: wallet.address });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Password errata');
    } finally { setLoading(false); }
  };

  const handleDelete = async (wallet: StoredWallet) => {
    setLoading(true);
    try {
      // Verifica password prima di eliminare
      await unlockWallet(wallet.id, password);
      await deleteWallet(wallet.id);
      await load();
      close();
      showMsg('Wallet eliminato');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Password errata');
    } finally { setLoading(false); }
  };

  const handleRename = async (walletId: string) => {
    if (!newName.trim()) return setError('Inserisci un nuovo nome');
    setLoading(true);
    try {
      await renameWallet(walletId, newName);
      await load();
      close();
      showMsg('Wallet rinominato');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore');
    } finally { setLoading(false); }
  };

  const handleExport = async (wallet: StoredWallet) => {
    setLoading(true);
    try {
      await unlockWallet(wallet.id, password); // verifica password
      exportWalletToFile(wallet);
      close();
      showMsg('File wallet scaricato');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Password errata');
    } finally { setLoading(false); }
  };

  const handleImportFile = async () => {
    if (!fileContent) return setError('Seleziona un file wallet');
    setLoading(true);
    try {
      await importWalletFromFile(fileContent, password);
      await load();
      close();
      showMsg('Wallet importato con successo');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'File non valido o password errata');
    } finally { setLoading(false); }
  };

  const handleChangePwd = async (walletId: string) => {
    if (password !== password2) return setError('Le nuove password non coincidono');
    setLoading(true);
    try {
      await changePassword(walletId, oldPassword, password);
      close();
      showMsg('Password aggiornata');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore');
    } finally { setLoading(false); }
  };

  const pwdStrength = checkPasswordStrength(password);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#2E86C1' }}>
          🔐 Wallet Manager — Locale
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { reset(); setModal({ type: 'create' }); }}
            style={btnStyle('#27AE60')}>+ Nuovo Wallet</button>
          <button onClick={() => { reset(); setModal({ type: 'import_file' }); }}
            style={btnStyle('#8E44AD')}>📂 Importa File</button>
        </div>
      </div>

      {/* Messaggi */}
      {error   && <div style={alertStyle('#e74c3c')}>{error}</div>}
      {success && <div style={alertStyle('#27ae60')}>{success}</div>}

      {/* Avviso sicurezza */}
      <div style={{ background: '#1A3A5C', color: '#AED6F1', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
        🛡️ <strong>Sicurezza locale:</strong> le chiavi private sono cifrate con AES-256-GCM
        e salvate solo nel tuo browser (IndexedDB). Non escono mai dal tuo computer.
      </div>

      {/* Lista wallet */}
      {wallets.length === 0
        ? <p style={{ color: '#808B96' }}>Nessun wallet — creane uno per iniziare.</p>
        : wallets.map(w => (
          <WalletCard key={w.id} wallet={w}
            onUnlock  ={() => { reset(); setModal({ type: 'unlock',     walletId: w.id }); }}
            onExport  ={() => { reset(); setModal({ type: 'export',     wallet: w }); }}
            onDelete  ={() => { reset(); setModal({ type: 'delete',     wallet: w }); }}
            onRename  ={() => { reset(); setNewName(w.name); setModal({ type: 'rename', wallet: w }); }}
            onChangePwd={() => { reset(); setModal({ type: 'change_pwd', walletId: w.id }); }}
            onSelect  ={() => onWalletSelect?.(w)}
          />
        ))
      }

      {/* ─── Modal Crea ─────────────────────────────────────────────────── */}
      {modal.type === 'create' && (
        <ModalOverlay onClose={close} title="Crea Nuovo Wallet">
          <Field label="Nome wallet" value={name} onChange={setName} placeholder="Es. Wallet Principale" />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          <PasswordBar strength={pwdStrength} />
          <Field label="Conferma password" value={password2} onChange={setPassword2} type="password" />
          {error && <Err>{error}</Err>}
          <p style={{ fontSize: '12px', color: '#AED6F1', marginTop: '8px' }}>
            ⚠️ La password cifra la chiave privata. Se la dimentichi,
            non potrai più accedere ai fondi senza il backup della chiave.
          </p>
          <Actions>
            <button onClick={handleCreate} disabled={loading} style={btnStyle('#27AE60')}>
              {loading ? '...' : '✓ Crea'}
            </button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Mostra Chiave ────────────────────────────────────────── */}
      {modal.type === 'show_key' && (
        <ModalOverlay onClose={close} title="⚠️ Chiave Privata — Salva Subito">
          <p style={{ color: '#F39C12' }}>
            Questa è l'<strong>unica volta</strong> che vedi la chiave privata in chiaro.
            Salvala in un posto sicuro offline (carta, password manager locale).
          </p>
          <div style={{ background: '#0D1117', padding: '12px', borderRadius: '6px', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '13px', color: '#2ECC71', border: '1px solid #27AE60' }}>
            <strong>Indirizzo:</strong><br />
            {modal.address}
            <br /><br />
            <strong>Chiave Privata:</strong><br />
            {modal.privateKey}
          </div>
          <p style={{ fontSize: '12px', color: '#E74C3C', marginTop: '8px' }}>
            🔴 Non condividere mai questa chiave. Chi la possiede controlla i fondi.
          </p>
          <Actions>
            <button onClick={() => {
              navigator.clipboard.writeText(modal.privateKey);
              showMsg('Copiata negli appunti (cancella dopo aver salvato)');
            }} style={btnStyle('#F39C12')}>📋 Copia</button>
            <button onClick={close} style={btnStyle('#27AE60')}>✓ Ho salvato</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Sblocca ──────────────────────────────────────────────── */}
      {modal.type === 'unlock' && (
        <ModalOverlay onClose={close} title="Sblocca Wallet">
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={() => handleUnlock(modal.walletId)} disabled={loading}
              style={btnStyle('#2E86C1')}>{loading ? '...' : '🔓 Sblocca'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Esporta ──────────────────────────────────────────────── */}
      {modal.type === 'export' && (
        <ModalOverlay onClose={close} title="Esporta Wallet">
          <p style={{ color: '#AED6F1' }}>
            Il file esportato contiene la chiave privata cifrata.
            Serve la password per usarlo.
          </p>
          <Field label="Conferma password" value={password} onChange={setPassword} type="password" />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={() => handleExport(modal.wallet)} disabled={loading}
              style={btnStyle('#8E44AD')}>{loading ? '...' : '💾 Scarica file'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Importa File ─────────────────────────────────────────── */}
      {modal.type === 'import_file' && (
        <ModalOverlay onClose={close} title="Importa Wallet da File">
          <input type="file" accept=".json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileContent(await f.text());
            }}
            style={{ marginBottom: '12px', color: '#AED6F1' }}
          />
          <Field label="Password del wallet" value={password} onChange={setPassword} type="password" />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={handleImportFile} disabled={loading || !fileContent}
              style={btnStyle('#8E44AD')}>{loading ? '...' : '📂 Importa'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Elimina ──────────────────────────────────────────────── */}
      {modal.type === 'delete' && (
        <ModalOverlay onClose={close} title="🗑️ Elimina Wallet">
          <p style={{ color: '#E74C3C' }}>
            <strong>Attenzione:</strong> eliminare il wallet dal browser
            non elimina i fondi dalla blockchain.
            Assicurati di avere un backup della chiave privata.
          </p>
          <Field label="Conferma password" value={password} onChange={setPassword} type="password" />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={() => handleDelete(modal.wallet)} disabled={loading}
              style={btnStyle('#E74C3C')}>{loading ? '...' : '🗑️ Elimina'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Rinomina ─────────────────────────────────────────────── */}
      {modal.type === 'rename' && (
        <ModalOverlay onClose={close} title="Rinomina Wallet">
          <Field label="Nuovo nome" value={newName} onChange={setNewName} />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={() => handleRename(modal.wallet.id)} disabled={loading}
              style={btnStyle('#2E86C1')}>{loading ? '...' : '✏️ Rinomina'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

      {/* ─── Modal Cambia Password ──────────────────────────────────────── */}
      {modal.type === 'change_pwd' && (
        <ModalOverlay onClose={close} title="Cambia Password">
          <Field label="Password attuale" value={oldPassword} onChange={setOldPassword} type="password" />
          <Field label="Nuova password"   value={password}    onChange={setPassword}    type="password" />
          <PasswordBar strength={pwdStrength} />
          <Field label="Conferma nuova"   value={password2}   onChange={setPassword2}   type="password" />
          {error && <Err>{error}</Err>}
          <Actions>
            <button onClick={() => handleChangePwd(modal.walletId)} disabled={loading}
              style={btnStyle('#F39C12')}>{loading ? '...' : '🔑 Aggiorna'}</button>
            <button onClick={close} style={btnStyle('#7F8C8D')}>Annulla</button>
          </Actions>
        </ModalOverlay>
      )}

    </div>
  );
}

// ─── Sub-componenti ───────────────────────────────────────────────────────────

function WalletCard({ wallet, onUnlock, onExport, onDelete, onRename, onChangePwd, onSelect }: {
  wallet: StoredWallet;
  onUnlock: () => void; onExport: () => void; onDelete: () => void;
  onRename: () => void; onChangePwd: () => void; onSelect: () => void;
}) {
  return (
    <div style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong style={{ color: '#2E86C1', fontSize: '16px' }}>{wallet.name}</strong>
          <div style={{ color: '#AED6F1', fontFamily: 'monospace', fontSize: '12px', marginTop: '4px' }}>
            {wallet.address}
          </div>
          <div style={{ color: '#808B96', fontSize: '12px', marginTop: '4px' }}>
            Saldo: <strong style={{ color: '#2ECC71' }}>{wallet.balance?.toFixed(4) ?? '—'} HBT</strong>
            &nbsp;·&nbsp; Creato: {new Date(wallet.createdAt).toLocaleDateString('it-IT')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={onSelect}    style={smallBtn('#1F6AA5')} title="Usa questo wallet">✓ Usa</button>
          <button onClick={onUnlock}    style={smallBtn('#2E86C1')} title="Mostra chiave privata">🔓</button>
          <button onClick={onExport}    style={smallBtn('#8E44AD')} title="Esporta backup">💾</button>
          <button onClick={onRename}    style={smallBtn('#F39C12')} title="Rinomina">✏️</button>
          <button onClick={onChangePwd} style={smallBtn('#E67E22')} title="Cambia password">🔑</button>
          <button onClick={onDelete}    style={smallBtn('#E74C3C')} title="Elimina">🗑️</button>
        </div>
      </div>
    </div>
  );
}

function ModalOverlay({ children, onClose, title }: {
  children: React.ReactNode; onClose: () => void; title: string;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1A2634', border: '1px solid #2E86C1', borderRadius: '10px', padding: '24px', width: '420px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#2E86C1' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#808B96', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', color: '#AED6F1', fontSize: '13px', marginBottom: '4px' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', background: '#0D1117', border: '1px solid #2E86C1', borderRadius: '4px', padding: '8px 10px', color: '#ECF0F1', fontFamily: 'monospace', fontSize: '14px' }}
      />
    </div>
  );
}

function PasswordBar({ strength }: { strength: ReturnType<typeof checkPasswordStrength> }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ height: '4px', background: '#2C3E50', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(strength.score / 4) * 100}%`, background: strength.color, transition: 'width .3s, background .3s' }} />
      </div>
      <span style={{ fontSize: '11px', color: strength.color }}>{strength.label}</span>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>{children}</div>;
}

function Err({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#E74C3C', fontSize: '13px', marginTop: '8px' }}>{children}</div>;
}

// ─── Stili ────────────────────────────────────────────────────────────────────

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, color: '#fff', border: 'none', padding: '8px 14px',
    borderRadius: '5px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
  };
}

function smallBtn(bg: string): React.CSSProperties {
  return { ...btnStyle(bg), padding: '5px 9px', fontSize: '14px' };
}

function alertStyle(color: string): React.CSSProperties {
  return {
    background: color + '22', border: `1px solid ${color}`, color: color,
    padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px',
  };
}

export default WalletManager;
