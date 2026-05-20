# HashBurst WebApp — Guida alla Migrazione da Supabase a Storage Locale

## Riepilogo delle Modifiche

### Problema risolto
La versione originale salvava i wallet (incluse le chiavi private cifrate) su **Supabase** — un database cloud esterno. Questo significava che le chiavi transitavano in rete e venivano conservate su server di terze parti, esattamente il problema segnalato.

### Soluzione implementata
Tutto il dato sensibile ora vive **esclusivamente nel browser dell'utente** tramite IndexedDB — un database locale persistente disponibile su tutti i browser moderni.

---

## File Modificati / Creati

### 1. `src/lib/localStore.ts` — NUOVO (sostituisce Supabase)

**Cosa fa:** Implementa un layer di storage locale completo usando IndexedDB con quattro store:
- `wallets` — wallet cifrati
- `blockchain_records` — record locali
- `settings` — configurazione nodo e preferenze
- `network_cache` — cache delle risposte dei nodi (con TTL)

**Come si usa:**
```typescript
import { walletStore, settingsStore, networkCache } from './lib/localStore';

// Leggi tutti i wallet
const wallets = await walletStore.getAll();

// Salva impostazioni
await settingsStore.save({ nodeUrl: 'http://mio-nodo:8002' });

// Cache risposta nodo per 30 secondi
await networkCache.set('node_status', data, 30);
```

**Perché IndexedDB e non localStorage:**
- localStorage ha limite di 5-10 MB e non supporta strutture dati complesse
- IndexedDB supporta GB di dati, indici, query, transazioni ACID
- IndexedDB è asincrono — non blocca il thread principale
- Stesso storage usato da MetaMask per i wallet

---

### 2. `src/lib/crypto.ts` — RISCRITTO

**Cosa fa:** Tutta la crittografia locale con:
- **Generazione chiavi:** `@noble/secp256k1` (secp256k1 + keccak256 = identico a Ethereum)
- **Cifratura chiavi:** AES-256-GCM tramite Web Crypto API nativa
- **Derivazione password:** PBKDF2 con 100.000 iterazioni e SHA-256

**Perché @noble/secp256k1 invece della Web Crypto API:**
La Web Crypto API del browser non supporta la curva secp256k1 (usata da Bitcoin ed Ethereum) — supporta solo P-256, P-384, P-521. `@noble/secp256k1` è la libreria usata da MetaMask, Ledger, e altri wallet seri: pura TypeScript, zero dipendenze native, verificata dalla comunità di sicurezza.

**Il modello di sicurezza:**
```
GENERAZIONE    → secp256k1 in RAM, mai toccata dal browser storage
     ↓
CIFRATURA      → AES-256-GCM con chiave derivata da PBKDF2(password, salt, 100K iter)
     ↓
STORAGE        → solo blob cifrato + salt + IV in IndexedDB
     ↓
DECIFRAZIONE   → in RAM su richiesta, scartata dopo l'uso
     ↓
EXPORT         → file .json con blob cifrato (sicuro da condividere)
```

---

### 3. `src/services/wallet.ts` — RISCRITTO

**Cosa fa:** Servizio wallet completo senza Supabase:
- `createWallet(name, password)` — genera, cifra, salva localmente
- `unlockWallet(id, password)` — decifra in RAM, ritorna chiave
- `exportWalletToFile(wallet)` — scarica file .json cifrato
- `importWalletFromFile(json, password)` — importa e verifica
- `changePassword(id, oldPwd, newPwd)` — re-cifra con nuova password

**Confronto con Monero GUI:**
Identico nel modello di sicurezza: le chiavi private sono cifrate con la password dell'utente e salvate localmente. La differenza è il formato del file (.json vs .keys) e il tipo di storage (IndexedDB vs file system).

---

### 4. `src/services/hashburst.ts` — RISCRITTO

**Cosa fa:** Client API con:
- Failover automatico tra i tre nodi (31.25.11.195:8002, :8003, :8005)
- Cache locale in IndexedDB per funzionamento degradato offline
- Timeout di 5 secondi per ogni nodo
- Funziona senza Supabase — i dati pubblici vengono dai nodi REST

---

### 5. `src/components/WalletManager.tsx` — RISCRITTO

**Cosa fa:** UI completa per gestione wallet locale:
- Crea wallet con valutazione forza password
- Mostra chiave privata una sola volta alla creazione
- Sblocca (decifra) su richiesta con password
- Esporta file di backup cifrato
- Importa da file
- Cambia password
- Elimina con conferma password

---

### 6. `src/components/Settings.tsx` — NUOVO

**Cosa fa:** Pannello impostazioni locale:
- Configurazione URL nodo primario (modificabile dall'utente)
- Test connessione ai nodi con latency
- Backup completo (export JSON con tutto)
- Restore da backup
- Reset completo dati locali

---

### 7. `package.json` — MODIFICATO

**Rimosso:**
```
@supabase/supabase-js
```

**Aggiunto:**
```
@noble/secp256k1  — crittografia secp256k1 production-grade
@noble/hashes     — keccak256 per address Ethereum-style
```

---

## File da Eliminare dal Progetto Originale

```
src/lib/supabase.ts          ← eliminare completamente
supabase/                    ← eliminare la cartella
deployment/register-nodes.ts ← non più necessario (niente DB cloud)
```

**Variabili .env da rimuovere:**
```
VITE_SUPABASE_URL=...       ← non più necessaria
VITE_SUPABASE_ANON_KEY=...  ← non più necessaria
```

**Variabili .env da mantenere:**
```
VITE_HASHBURST_API_URL=http://31.25.11.195:8002   ← nodo primario
VITE_HASHBURST_BACKEND_URL=http://31.25.11.195:8001
VITE_IPFS_GATEWAY=http://31.25.11.195:8080/ipfs
VITE_IPFS_API=http://31.25.11.195:5001
```

---

## Compatibilità Browser

| Browser | IndexedDB | Web Crypto API | @noble/secp256k1 |
|---------|-----------|----------------|------------------|
| Chrome 58+ | ✅ | ✅ | ✅ |
| Firefox 55+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Edge 79+ | ✅ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ | ✅ |
| Mobile Safari | ✅ | ✅ | ✅ |

**Requisito minimo:** un browser moderno (2021+). Tutti i browser attuali sono supportati.

---

## Installazione dopo la migrazione

```bash
# 1. Clona il repo
git clone https://github.com/hashburst/HashBurst-Blockchain-WebApp-Core
cd HashBurst-Blockchain-WebApp-Core

# 2. Sostituisci i file modificati con quelli di questa migrazione

# 3. Installa dipendenze (nota: @supabase non è più presente)
npm install

# 4. Crea .env (senza Supabase)
cat > .env << EOF
VITE_HASHBURST_API_URL=http://31.25.11.195:8002
VITE_HASHBURST_BACKEND_URL=http://31.25.11.195:8001
VITE_IPFS_GATEWAY=http://31.25.11.195:8080/ipfs
VITE_IPFS_API=http://31.25.11.195:5001
EOF

# 5. Avvia
npm run dev
# → apri http://localhost:5173
```

---

## Confronto Finale: Prima vs Dopo

| Aspetto | Prima (con Supabase) | Dopo (locale) |
|---------|---------------------|----------------|
| Storage chiavi | Supabase cloud (AWS) | IndexedDB browser locale |
| Transito in rete | Sì — chiave cifrata → cloud | No — mai |
| Funziona offline | No | Sì (con cache) |
| Dipende da terze parti | Sì (Supabase) | No |
| Backup | Automatico su cloud | File .json manuale |
| Multi-dispositivo | Sì (via cloud) | Solo con export/import manuale |
| Livello sicurezza | Simile a MetaMask hosted | Identico a MetaMask locale |
| Compatibile Monero GUI model | No | Sì |

---

## Nota sul Multi-Dispositivo

L'unica feature che si perde rimuovendo Supabase è la sincronizzazione automatica tra dispositivi diversi. La soluzione:

1. **Export manuale** del wallet cifrato (file .json)
2. **Import** sul secondo dispositivo
3. Le chiavi private sono già cifrate nel file → sicuro da trasferire via email/USB

Questo è esattamente il modello di Monero GUI: porti il file del wallet, non si sincronizza magicamente tra computer.

---

*Migrazione completata. La WebApp HashBurst è ora local-first come Monero GUI.*
