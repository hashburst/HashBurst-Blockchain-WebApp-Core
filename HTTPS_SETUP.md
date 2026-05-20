# Guida HTTPS per HashBurst — hashburst.io

La Web Crypto API del browser (`crypto.subtle`) — usata per cifrare le
chiavi private con AES-256-GCM — funziona **solo** su:

- `https://` qualsiasi dominio
- `http://localhost` o `http://127.0.0.1`

Su `http://IP:porta` il browser blocca `crypto.subtle` con:
```
DOMException: The operation is insecure.
```

Questo significa che su HTTP la cifratura delle chiavi private
**non funziona affatto** — l'app si rompe silenziosamente.

---

## Setup certificato SSL su hashburst.io (77.90.188.157)

### 1. Installa Certbot sul server

```bash
ssh root@77.90.188.157
apt-get install -y certbot
```

### 2. Ottieni il certificato

Assicurati che il DNS punti già al server (il ping che hai fatto
conferma: hashburst.io → 77.90.188.157)

```bash
# Se nginx non sta girando ancora:
certbot certonly --standalone \
  -d hashburst.io \
  -d www.hashburst.io \
  --email admin@hashburst.io \
  --agree-tos \
  --non-interactive

# Se nginx sta già girando (usa il webroot):
certbot certonly --webroot \
  -w /var/www/certbot \
  -d hashburst.io \
  -d www.hashburst.io \
  --email admin@hashburst.io \
  --agree-tos \
  --non-interactive
```

### 3. Configura nginx con HTTPS

Copia il file `nginx-ssl-snippet.conf` nella configurazione nginx:

```bash
# Sostituisce /etc/nginx/sites-available/hashburst
cp nginx-ssl-snippet.conf /etc/nginx/sites-available/hashburst
ln -sf /etc/nginx/sites-available/hashburst /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 4. Rinnovo automatico del certificato

Let's Encrypt scade ogni 90 giorni. Il rinnovo è automatico
via systemd timer (installato da certbot):

```bash
systemctl status certbot.timer
# Oppure aggiungi manualmente a crontab:
# 0 3 * * * certbot renew --quiet && systemctl reload nginx
```

### 5. Verifica

```bash
curl https://hashburst.io/health
# Deve rispondere: {"status":"ok"}

# Verifica certificato:
curl -I https://hashburst.io
# Deve mostrare: strict-transport-security: max-age=63072000
```

---

## Se hashburst.io cambia IP di nuovo

**Non toccare nulla nel codice.**

1. Aggiornare il record DNS A: `hashburst.io → nuovo_IP`
2. Attendere propagazione DNS (5-30 minuti)
3. Sul nuovo server: installare nginx + certbot, riottenere il certificato
4. Il `.env` della WebApp usa `https://hashburst.io/api` — funziona sempre

Il codice non contiene mai IP hardcoded.

---

## Struttura finale degli URL

```
Utente (browser locale)
    │
    │ HTTPS (443)
    ▼
hashburst.io  ←── nginx con Let's Encrypt SSL
    │
    ├── /api/       → http://localhost:8007  (nodo Go, interno)
    ├── /ipfs/      → http://localhost:8080  (IPFS gateway, interno)
    ├── /ipfs-api/  → http://localhost:5001  (IPFS API, interno)
    ├── /hvm/       → http://localhost:8181  (HVM, interno)
    └── /           → http://localhost:3000  (Explorer, interno)
```

All'esterno: solo HTTPS. All'interno del server: HTTP tra i container.
