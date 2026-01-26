# HashBurst - Blockchain & IPFS Platform

A complete web application and infrastructure for the HashBurst blockchain mainnet with integrated IPFS storage, P2P networking, and resource federation.

![HashBurst](https://img.shields.io/badge/HashBurst-Mainnet-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Network](https://img.shields.io/badge/Nodes-3%20Blockchain%20%2B%202%20IPFS-orange)

## What is HashBurst Core?

HashBurst is a decentralized blockchain platform that combines:
- **Blockchain Network**: 3-node mainnet with PoA consensus
- **IPFS Storage**: Distributed file storage across 2 nodes
- **P2P Network**: Trustless peer-to-peer architecture
- **Resource Federation**: Share compute, storage, and bandwidth
- **Web Dashboard**: Complete management interface
- **Smart Contracts**: HBT-20 and HBT-721 support

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to servers (for deployment)
- Docker (on servers)

### Installation

```bash
# Clone repository
git clone [your-repo-url]
cd hashburst

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Deploy Mainnet Nodes

Follow the complete guide: **[MAINNET_SETUP.md](MAINNET_SETUP.md)**

Quick version:
```bash
# 1. Deploy servers (see deployment/ folder)
# 2. Register nodes
npm run deploy:register

# 3. Monitor network
npm run deploy:monitor

# 4. Start dashboard
npm run dev
```

## Project Structure

```
hashburst/
├── src/
│   ├── components/          # React components
│   │   ├── WalletManager.tsx          # Wallet management
│   │   ├── NodeSetup.tsx              # Node deployment UI
│   │   ├── FileUpload.tsx             # IPFS upload interface
│   │   ├── RecordsViewer.tsx          # Blockchain records
│   │   ├── SmartContracts.tsx         # Contract deployment
│   │   ├── FederationDashboard.tsx    # Resource federation
│   │   ├── P2PNetwork.tsx             # Network monitoring
│   │   └── NetworkStatus.tsx          # Live stats
│   │
│   ├── services/            # Business logic
│   │   ├── wallet.ts        # Wallet generation & management
│   │   ├── node.ts          # Node configuration
│   │   ├── hashburst.ts     # Blockchain API client
│   │   ├── ipfs.ts          # IPFS integration
│   │   └── federation.ts    # Resource management
│   │
│   ├── lib/                 # Utilities
│   │   └── supabase.ts      # Database client & types
│   │
│   └── App.tsx              # Main application
│
├── deployment/              # Server deployment files
│   ├── server1-ubuntu/      # Server 1 (31.25.11.195)
│   ├── server2-cloudlinux/  # Server 2 (85.187.128.14)
│   ├── monitoring/          # Health checks & monitoring
│   ├── register-nodes.ts    # Database registration
│   ├── DEPLOYMENT.md        # Complete deployment guide
│   └── README.md            # Deployment quick reference
│
├── supabase/                # Database migrations
│   └── migrations/          # SQL migration files
│
├── MAINNET_SETUP.md         # Quick deployment guide
├── DEPLOYMENT_SUMMARY.md    # What was built
└── README.md                # This file
```

## Features

### 1. **Wallet Management**
- Generate secure wallets with cryptographic keys
- Multiple wallet support
- Backup and export functionality
- Balance tracking
- Transaction history

### 2. **Node Deployment**
- Download full node packages
- Platform-specific installers (Linux, macOS, Windows, Docker)
- Automated configuration generation
- Step-by-step setup wizard
- Join mainnet with one click

### 3. **File Upload & IPFS**
- Drag-and-drop file upload
- Automatic IPFS storage
- Blockchain record creation
- Public record keeping
- Content-addressed retrieval

### 4. **Public Records**
- Browse all blockchain records
- Filter by type (file, event, data, contract)
- Real-time updates
- IPFS content links
- Transaction verification

### 5. **Smart Contracts**
- Deploy HBT-20 tokens (fungible)
- Deploy HBT-721 NFTs (non-fungible)
- Custom contract support
- Contract interaction interface
- Transaction tracking

### 6. **Resource Federation**
- Register compute resources
- Allocate storage space
- Share bandwidth
- Earn rewards automatically
- Reputation system

### 7. **P2P Network**
- Real-time node monitoring
- Connection status
- Network statistics
- Latency tracking
- Peer discovery

### 8. **Network Dashboard**
- Live blockchain stats
- Block height tracking
- Transaction throughput (TPS)
- Active nodes counter
- Network health indicators

## Mainnet Information

### Deployed Nodes

| Node | Server | IP | RPC | P2P |
|------|--------|----|----|-----|
| Node 1 | Ubuntu 24.04 | 31.25.11.195 | 8002 | 30303 |
| Node 2 | CloudLinux 7.9 | 85.187.128.14 | 8003 | 30304 |
| Node 3 | CloudLinux 7.9 | 85.187.128.14 | 8005 | 30305 |

### IPFS Nodes

| Node | Server | Gateway | API | Swarm |
|------|--------|---------|-----|-------|
| IPFS 1 | Ubuntu 24.04 | 8080 | 5001 | 4001 |
| IPFS 2 | CloudLinux 7.9 | 8081 | 5002 | 4002 |

### Network Stats
- **Consensus**: Proof of Authority (PoA)
- **Block Time**: 5 seconds
- **Chain ID**: 1337
- **Total Capacity**: 200GB storage, 8 CPU cores
- **Network Type**: Trustless P2P Mesh

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run typecheck        # Type checking

# Deployment
npm run deploy:register  # Register nodes in database
npm run deploy:monitor   # Check network status
npm run deploy:health    # Continuous health monitoring

# Code Quality
npm run lint             # Lint code
```

### Environment Variables

Create `.env` file:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# HashBurst Mainnet (default)
VITE_HASHBURST_API_URL=http://31.25.11.195:8002
VITE_HASHBURST_BACKEND_URL=http://31.25.11.195:8001
VITE_IPFS_GATEWAY=http://31.25.11.195:8080/ipfs
VITE_IPFS_API=http://31.25.11.195:5001
```

### Database Setup

Migrations are in `supabase/migrations/`:
1. `create_hashburst_schema.sql` - Core tables
2. `add_wallet_node_federation_schema.sql` - Extended features

Tables created:
- `blockchain_records` - File & data records
- `network_nodes` - Node registry
- `smart_contracts` - Deployed contracts
- `user_wallets` - Wallet management
- `federated_resources` - Resource allocation
- `ipfs_nodes` - IPFS node registry
- `node_transactions` - Transaction log
- `p2p_connections` - Network connectivity

All tables have Row Level Security (RLS) enabled.

## Deployment

### Option 1: Quick Deploy (Recommended)

Follow **[MAINNET_SETUP.md](MAINNET_SETUP.md)** for step-by-step guide.

### Option 2: Manual Deploy

See **[deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)** for detailed instructions.

### Option 3: Docker Compose

```bash
# Server 1
cd deployment/server1-ubuntu
docker-compose up -d

# Server 2
cd deployment/server2-cloudlinux
docker-compose up -d
```

## Monitoring

### Check Network Status
```bash
npm run deploy:monitor
```

### Continuous Health Check
```bash
npm run deploy:health &
tail -f /var/log/hashburst-health.log
```

### Node Endpoints
```bash
# Check individual nodes
curl http://31.25.11.195:8002/api/status
curl http://85.187.128.14:8003/api/status
curl http://85.187.128.14:8005/api/status

# Check IPFS nodes
curl http://31.25.11.195:5001/api/v0/id
curl http://85.187.128.14:5002/api/v0/id
```

## Security

- Row Level Security (RLS) on all database tables
- Encrypted private keys in wallets
- Firewall rules automatically configured
- Docker container isolation
- CORS properly configured
- No secrets in source code
- Environment variables for sensitive data

## Earning Rewards

1. **Create Wallet**: Use Wallet tab to generate address
2. **Run Node**: Deploy using Node tab
3. **Configure**: Add wallet to node config
4. **Federate Resources**: Enable in node settings
5. **Earn**: Automatic rewards for:
   - Transaction validation
   - IPFS file hosting
   - Compute resources
   - Storage allocation
   - High uptime

## How It Works

### File Upload Flow
1. User uploads file via web interface
2. File sent to IPFS node → generates CID
3. Transaction created on blockchain with CID
4. Record stored in database
5. File accessible via IPFS gateway

### Node Communication
1. Nodes connect via P2P protocol
2. Bootstrap nodes provide initial peers
3. Consensus through PoA algorithm
4. Block propagation across network
5. State synchronization

### Resource Federation
1. Node registers available resources
2. Resources allocated to network
3. Usage tracked automatically
4. Rewards calculated and distributed
5. Reputation score maintained

## Documentation

- **Quick Start**: This README
- **Deployment**: [MAINNET_SETUP.md](MAINNET_SETUP.md)
- **Full Guide**: [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)
- **Summary**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
- **HashBurst Framework**: https://github.com/hashburst/blockchain-hvm-framework

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

This project is part of the HashBurst blockchain ecosystem.

## Troubleshooting

### Nodes Not Connecting
- Check firewall rules
- Verify P2P ports open
- Check bootstrap nodes

### IPFS Upload Fails
- Verify IPFS node running
- Check API endpoint
- Ensure sufficient storage

### Database Errors
- Check Supabase credentials
- Verify RLS policies
- Run migrations

### Build Fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run build -- --force`
- Check Node version: `node -v` (should be 18+)

## Support

- **Issues**: Create on GitHub
- **Documentation**: See files above
- **Network Status**: `npm run deploy:monitor`

## Success:

HashBurst mainnet is ready when you see:
- All nodes online in Network tab
- IPFS nodes accessible
- Can upload files
- Records appear in blockchain
- P2P connections active

## Links

- **GitHub**: https://github.com/hashburst/blockchain-hvm-framework
- **Mainnet**: http://31.25.11.195:8002
- **IPFS**: http://31.25.11.195:8080

---

**Built with**:
React • TypeScript • Vite • Tailwind CSS • Supabase • Docker • IPFS • HashBurst

**Network Status**: Production Ready
**Version**: 1.0.0
**Nodes**: 3 Blockchain + 2 IPFS
**Architecture**: Trustless P2P

**Welcome to HashBurst Mainnet!**
