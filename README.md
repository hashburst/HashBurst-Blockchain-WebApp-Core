# HashBurst — Blockchain & IPFS Platform

A complete web application and infrastructure for the HashBurst blockchain mainnet with integrated IPFS storage, P2P networking, and resource federation.

[![HashBurst](https://img.shields.io/badge/HashBurst-Mainnet-blue)](https://hashburst.io)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://hashburst.io/health)
[![Network](https://img.shields.io/badge/Nodes-4%20Blockchain%20%2B%202%20IPFS-orange)](https://hashburst.io)
[![Security](https://img.shields.io/badge/Keys-Local%20AES--256--GCM-green)](https://hashburst.io)

## What is HashBurst Core?

HashBurst is a decentralized blockchain platform that combines:

- **Blockchain Network**: 4-node mainnet with APoW + PoH consensus
- **IPFS Storage**: Distributed file storage across 2 nodes
- **P2P Network**: Trustless peer-to-peer architecture
- **Resource Federation**: Share compute, storage, and bandwidth
- **Web Dashboard**: Complete management interface — runs locally in the browser
- **Smart Contracts**: HBT-20 and HBT-721 support via HVM
- **Local-first Security**: Private keys never leave the user's device

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A modern browser (Chrome 80+, Firefox 80+, Safari 14+, Edge 80+)
- **HTTPS or localhost** — required for Web Crypto API (key encryption)

### Installation

```bash
# Clone repository
git clone https://github.com/hashburst/HashBurst-Blockchain-WebApp-Core
cd HashBurst-Blockchain-WebApp-Core

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# The default .env.example already points to https://hashburst.io/api
# No changes needed for standard use

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note**: `crypto.subtle` (used for key encryption) requires either
> `localhost` or an HTTPS origin. The dev server on localhost works out of the box.

### Deploy Mainnet Nodes

Follow the complete guide: **[MAINNET_SETUP.md](./MAINNET_SETUP.md)**

---

## Project Structure

```
hashburst/
├── src/
│   ├── components/
│   │   ├── WalletManager.tsx      # Local wallet management (no cloud)
│   │   ├── NodeSetup.tsx          # Node deployment UI
│   │   ├── FileUpload.tsx         # IPFS upload interface
│   │   ├── RecordsViewer.tsx      # Blockchain records
│   │   ├── SmartContracts.tsx     # Contract deployment
│   │   ├── FederationDashboard.tsx# Resource federation
│   │   ├── P2PNetwork.tsx         # Network monitoring
│   │   ├── NetworkStatus.tsx      # Live stats
│   │   └── Settings.tsx           # Local settings & backup
│   │
│   ├── services/
│   │   ├── wallet.ts              # Wallet — local, AES-256-GCM encrypted
│   │   ├── hashburst.ts           # Blockchain API client with failover
│   │   └── ipfs.ts                # IPFS integration
│   │
│   ├── lib/
│   │   ├── localStore.ts          # IndexedDB storage (replaces Supabase)
│   │   ├── crypto.ts              # secp256k1 + AES-256-GCM + PBKDF2
│   │   ├── config.ts              # Single source for env variables
│   │   └── browserCheck.ts        # Browser compatibility checks
│   │
│   ├── hooks/
│   │   ├── useWallets.ts          # Wallet state management + auto-lock
│   │   └── useNetwork.ts          # Node polling & status
│   │
│   └── App.tsx                    # Main application
│
├── deployment/
│   ├── server1-ubuntu/            # Node 1 (Equinix ML5)
│   ├── server2-cloudlinux/        # Nodes 2 & 3 (Equinix ML5)
│   ├── node4-hashburst-io/        # Node 4 — hashburst.io
│   ├── monitoring/                # Health checks
│   └── DEPLOYMENT.md
│
├── .env.example                   # Environment template (use this, not .env)
├── MIGRATION_GUIDE.md             # Supabase → local storage migration log
├── HTTPS_SETUP.md                 # How to configure SSL on the server
├── MAINNET_SETUP.md               # Node deployment guide
└── README.md
```

---

## Security Architecture

### Private Keys — Local-First Model

Private keys **never leave the user's device** and **never transit the network**.
The model is identical to MetaMask and hardware wallets:

```
KEY GENERATION  →  secp256k1 via @noble/secp256k1 (in RAM only)
      ↓
ENCRYPTION      →  AES-256-GCM + PBKDF2(password, salt, 100 000 iter)
      ↓
STORAGE         →  IndexedDB (browser local database — never uploaded)
      ↓
DECRYPTION      →  In RAM on demand, discarded after use
      ↓
EXPORT/BACKUP   →  Encrypted .json file (safe to transfer)
```

> The old Supabase cloud storage has been fully removed.
> See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

### HTTPS Requirement

The Web Crypto API (`crypto.subtle`) used for key encryption requires a
**secure origin** — either `https://` or `localhost`.

- `http://localhost:5173` ✅ development
- `https://hashburst.io` ✅ production
- `http://IP:PORT` ❌ crypto.subtle blocked by browser

All API calls go through `https://hashburst.io` which terminates SSL via
nginx + Let's Encrypt. Internal node communication remains HTTP inside
the Docker network.

---

## Mainnet Network

### Blockchain Nodes

| Node | Location | Domain / IP | RPC | P2P |
|------|----------|-------------|-----|-----|
| Node 1 | Equinix ML5 | 85.187.128.14 | 8002 | 30303 |
| Node 2 | Equinix ML5 | 85.187.128.14 | 8003 | 30304 |
| Node 3 | Equinix ML5 | 85.187.128.14 | 8005 | 30305 |
| Node 4 | hashburst.io | **https://hashburst.io/api** | 8007 | 30306 |

> **Always use the domain `hashburst.io`, never a raw IP.**
> If the server migrates to a new IP, only the DNS record needs updating —
> no code or configuration changes required.

### IPFS Nodes

| Node | Gateway | API | Swarm |
|------|---------|-----|-------|
| IPFS 1 | https://hashburst.io/ipfs | /ipfs-api | 4001 |
| IPFS 2 | 85.187.128.14:8081 | 5002 | 4002 |

### Network Parameters

| Parameter | Value |
|-----------|-------|
| Consensus | APoW (Adaptive Proof of Work) + PoH |
| Block Time | 5 seconds |
| Chain ID | 1337 |
| Token | HBT |
| Signature | CRYSTALS-Dilithium (NIST FIPS 204) |
| Key Exchange | CRYSTALS-Kyber (NIST FIPS 203) |

---

## Environment Variables

Copy `.env.example` to `.env`. The defaults work for standard mainnet use:

```bash
cp .env.example .env
```

```bash
# .env.example — all defaults point to hashburst.io via HTTPS
VITE_HASHBURST_NODE_PRIMARY=https://hashburst.io/api
VITE_HASHBURST_NODES_FALLBACK=https://hashburst.io/api
VITE_IPFS_GATEWAY=https://hashburst.io/ipfs
VITE_IPFS_API=https://hashburst.io/ipfs-api
VITE_HVM_ENDPOINT=https://hashburst.io/hvm
VITE_CHAIN_ID=1337
VITE_NETWORK_NAME=HashBurst Mainnet
```

> **Never commit `.env`** — it is already listed in `.gitignore`.
> **Never use raw IPs** — use the domain so IP migrations are transparent.

---

## Features

### 1. Wallet Management (Local-First)
- Generate wallets with secp256k1 keys (Ethereum-compatible)
- Keys encrypted with AES-256-GCM + PBKDF2 — stored only in IndexedDB
- Auto-lock after 15 minutes of inactivity
- Export encrypted backup (.json file)
- Import from backup with password verification
- Change password (re-encrypts without exposing the key)

### 2. Node Deployment
- Download full node packages for Linux / macOS / Windows / Docker
- Automated configuration generation
- Step-by-step setup wizard
- Join mainnet with one click

### 3. File Upload & IPFS
- Drag-and-drop file upload
- Automatic IPFS storage with CID
- Blockchain record creation
- Content-addressed retrieval via https://hashburst.io/ipfs/:cid

### 4. Public Records
- Browse all blockchain records
- Filter by type (file, event, data, contract)
- Real-time updates
- IPFS content links and transaction verification

### 5. Smart Contracts
- Deploy HBT-20 tokens (fungible)
- Deploy HBT-721 NFTs (non-fungible)
- Contract interaction via HVM at https://hashburst.io/hvm
- Transaction tracking

### 6. Resource Federation
- Register compute resources
- Allocate storage space
- Share bandwidth
- Earn HBT rewards automatically

### 7. Network Dashboard
- Live blockchain stats
- Block height tracking
- Transaction throughput (TPS)
- Active nodes with latency
- Automatic failover between nodes

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server on localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript type check
npm run lint         # Lint code

# Deployment & monitoring
npm run deploy:monitor   # Check network status
npm run deploy:health    # Continuous health monitoring
```

---

## Deployment

### Option 1: Quick Deploy (Recommended)

Follow **[MAINNET_SETUP.md](./MAINNET_SETUP.md)** for step-by-step guide.

### Option 2: Docker Compose

```bash
# Node 4 — hashburst.io (reference deployment with HTTPS)
cd deployment/node4-hashburst-io
sudo ./deploy.sh

# Equinix ML5 nodes
cd deployment/server1-ubuntu
docker compose up -d

cd deployment/server2-cloudlinux
docker compose up -d
```

### Option 3: Manual

See **[deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md)**.

---

## Monitoring

```bash
# Check all nodes via HTTPS
curl https://hashburst.io/api/status | jq
curl https://hashburst.io/health

# NPM scripts
npm run deploy:monitor
npm run deploy:health
```

---

## Troubleshooting

**Nodes not connecting**
- Verify P2P ports 30303–30306 are open in the firewall
- Check bootstrap nodes are reachable

**IPFS upload fails**
- Verify IPFS node is running: `curl https://hashburst.io/ipfs-api/api/v0/id`
- Check available storage on the server

**`crypto.subtle` / key encryption not working**
- The app must run on `localhost` or `https://`. Raw `http://IP:PORT` blocks Web Crypto API.
- See [HTTPS_SETUP.md](./HTTPS_SETUP.md) for server configuration.

**Build fails**
- Clear modules: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (must be 18+)

---

## Earning Rewards

1. **Create Wallet** — use the Wallet tab (keys stay on your device)
2. **Run a Node** — deploy using the Node tab or `deployment/` scripts
3. **Configure** — add your HBT address to the node config as `rewardAddress`
4. **Federate Resources** — enable in node settings
5. **Earn** — automatic rewards for validation, IPFS hosting, compute, storage, uptime

---

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file |
| [MAINNET_SETUP.md](./MAINNET_SETUP.md) | Node deployment guide |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Supabase → local storage migration |
| [HTTPS_SETUP.md](./HTTPS_SETUP.md) | SSL configuration for hashburst.io |
| [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md) | Full deployment reference |
| [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | Infrastructure summary |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## Links

- **Explorer**: https://hashburst.io
- **API**: https://hashburst.io/api/status
- **IPFS Gateway**: https://hashburst.io/ipfs
- **GitHub Org**: https://github.com/hashburst

---

**Built with**:
React · TypeScript · Vite · Tailwind CSS · @noble/secp256k1 · IndexedDB · Docker · IPFS · HashBurst HVM

**Network Status**: Production Ready  
**Version**: 2.0.0  
**Nodes**: 4 Blockchain + 2 IPFS  
**Architecture**: Trustless P2P · Local-First · Post-Quantum Ready
