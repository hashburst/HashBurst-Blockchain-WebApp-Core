# HashBurst Mainnet Deployment

Complete deployment package for HashBurst mainnet nodes and IPFS infrastructure.

## Quick Start

### 1. Deploy Server 1 (Ubuntu 24.04)
```bash
ssh root@31.25.11.195
cd /opt
git clone [your-repo] hashburst
cd hashburst/deployment/server1-ubuntu
chmod +x deploy.sh
sudo ./deploy.sh
```

### 2. Deploy Server 2 (CloudLinux)
```bash
ssh hashburs@85.187.128.14
cd ~
git clone [your-repo] hashburst
cd hashburst/deployment/server2-cloudlinux
chmod +x deploy.sh
sudo ./deploy.sh
```

### 3. Register Nodes
```bash
# From your local machine
cd hashburst
npm install
npx tsx deployment/register-nodes.ts
```

### 4. Monitor Network
```bash
cd deployment/monitoring
chmod +x monitor.sh
./monitor.sh
```

## Directory Structure

```
deployment/
├── server1-ubuntu/          # Server 1 deployment files
│   ├── docker-compose.yml   # Docker services configuration
│   ├── node1-config.json    # Node 1 configuration
│   ├── deploy.sh            # Deployment script
│   └── nginx.conf           # Nginx reverse proxy config
│
├── server2-cloudlinux/      # Server 2 deployment files
│   ├── docker-compose.yml   # Docker services configuration
│   ├── node2-config.json    # Node 2 configuration
│   ├── node3-config.json    # Node 3 configuration
│   └── deploy.sh            # Deployment script
│
├── monitoring/              # Monitoring tools
│   ├── monitor.sh           # Network status checker
│   └── health-check.sh      # Continuous health monitoring
│
├── register-nodes.ts        # Database registration script
├── DEPLOYMENT.md            # Complete deployment guide
└── README.md                # This file
```

## Network Endpoints

### Server 1 (31.25.11.195)
- Node 1 RPC: `http://31.25.11.195:8002`
- Node 1 P2P: `31.25.11.195:30303`
- IPFS Gateway: `http://31.25.11.195:8080`
- IPFS API: `http://31.25.11.195:5001`

### Server 2 (85.187.128.14)
- Node 2 RPC: `http://85.187.128.14:8003`
- Node 2 P2P: `85.187.128.14:30304`
- Node 3 RPC: `http://85.187.128.14:8005`
- Node 3 P2P: `85.187.128.14:30305`
- IPFS Gateway: `http://85.187.128.14:8081`
- IPFS API: `http://85.187.128.14:5002`

## Verification

Test node connectivity:
```bash
# Check Node 1
curl http://31.25.11.195:8002/api/status

# Check Node 2
curl http://85.187.128.14:8003/api/status

# Check Node 3
curl http://85.187.128.14:8005/api/status
```

Test IPFS nodes:
```bash
# Check IPFS Node 1
curl http://31.25.11.195:5001/api/v0/id

# Check IPFS Node 2
curl http://85.187.128.14:5002/api/v0/id
```

## Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

## Monitoring

The monitoring script checks all nodes and displays their status:

```bash
cd deployment/monitoring
./monitor.sh
```

Expected output:
```
================================
HashBurst Network Monitor
================================

HashBurst Mainnet Nodes:
------------------------
Checking Node 1 (31.25.11.195)... ✓ Online
Checking Node 2 (85.187.128.14)... ✓ Online
Checking Node 3 (85.187.128.14)... ✓ Online

IPFS Nodes:
-----------
Checking IPFS Node 1 (31.25.11.195)... ✓ Online
Checking IPFS Node 2 (85.187.128.14)... ✓ Online
```

## Security Notes

- All services run in Docker containers
- Firewall rules are automatically configured
- Supabase RLS policies protect database
- Use environment variables for sensitive data
- Regular backups recommended

## Documentation

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Project documentation: [../README.md](../README.md)
- HashBurst framework: https://github.com/hashburst/blockchain-hvm-framework

## Troubleshooting

### Nodes Not Connecting
- Check firewall settings
- Verify P2P ports are open
- Check bootstrap nodes in config

### IPFS Issues
- Verify IPFS daemon is running
- Check swarm connectivity
- Ensure ports 4001/4002 are open

### Database Errors
- Verify Supabase credentials
- Check network connectivity
- Run registration script again

## Support

Create an issue on GitHub or check the full documentation for detailed troubleshooting steps.

---

**Version**: 1.0.0
**Network**: HashBurst Mainnet
**Status**: Production Ready
