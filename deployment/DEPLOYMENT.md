# HashBurst Mainnet Deployment Guide

This guide will help you deploy the HashBurst mainnet with 3 blockchain nodes and 2 IPFS nodes across 2 servers.

## Network Architecture

### Server 1: Ubuntu 24.04 VPS (31.25.11.195)
- **HashBurst Node 1** (Primary Validator)
  - RPC API: Port 8002
  - P2P Network: Port 30303
  - Backend API: Port 8001
- **IPFS Node 1**
  - Gateway: Port 8080
  - API: Port 5001
  - Swarm: Port 4001

### Server 2: CloudLinux 7.9 (85.187.128.14)
- **HashBurst Node 2** (Validator)
  - RPC API: Port 8003
  - P2P Network: Port 30304
  - Backend API: Port 8004
- **HashBurst Node 3** (Validator)
  - RPC API: Port 8005
  - P2P Network: Port 30305
  - Backend API: Port 8006
- **IPFS Node 2**
  - Gateway: Port 8081
  - API: Port 5002
  - Swarm: Port 4002

## Prerequisites

### Both Servers Need:
- Docker (latest version)
- Docker Compose (latest version)
- At least 4GB RAM
- At least 50GB free disk space
- Root or sudo access
- Open firewall ports (handled by scripts)

### Local Machine Needs:
- Node.js 18+ (for registration script)
- npm or yarn
- Access to Supabase dashboard

## Deployment Steps

### Step 1: Prepare Server 1 (Ubuntu 24.04 VPS)

SSH into the server:
```bash
ssh root@31.25.11.195
```

Create deployment directory:
```bash
mkdir -p /opt/hashburst
cd /opt/hashburst
```

Upload deployment files:
```bash
# From your local machine
scp -r deployment/server1-ubuntu/* root@31.25.11.195:/opt/hashburst/
```

Make scripts executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
sudo ./deploy.sh
```

The script will:
- Install Docker and Docker Compose
- Configure firewall (UFW)
- Pull required Docker images
- Start all services
- Display status information

### Step 2: Prepare Server 2 (CloudLinux 7.9)

SSH into the server:
```bash
ssh hashburs@85.187.128.14
```

Create deployment directory:
```bash
mkdir -p ~/hashburst
cd ~/hashburst
```

Upload deployment files:
```bash
# From your local machine
scp -r deployment/server2-cloudlinux/* hashburs@85.187.128.14:~/hashburst/
```

Make scripts executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
sudo ./deploy.sh
```

### Step 3: Register Nodes in Database

From your local machine (in the project directory):

Install dependencies if not already installed:
```bash
npm install @supabase/supabase-js tsx
```

Run the registration script:
```bash
npx tsx deployment/register-nodes.ts
```

This will:
- Register all 3 HashBurst nodes in the database
- Register both IPFS nodes
- Create P2P connections between nodes
- Set initial stats and metadata

### Step 4: Verify Deployment

Run the monitoring script:
```bash
cd deployment/monitoring
chmod +x monitor.sh
./monitor.sh
```

You should see all nodes reporting as online.

Check individual nodes:
```bash
# Node 1
curl http://31.25.11.195:8002/api/status

# Node 2
curl http://85.187.128.14:8003/api/status

# Node 3
curl http://85.187.128.14:8005/api/status

# IPFS Node 1
curl http://31.25.11.195:5001/api/v0/id

# IPFS Node 2
curl http://85.187.128.14:5002/api/v0/id
```

### Step 5: Access the Web Dashboard

Open your web application:
```bash
npm run dev
```

Navigate to:
- **Network Tab**: View all active nodes and P2P connections
- **Federation Tab**: See federated resources and IPFS nodes
- **Dashboard**: Monitor network statistics

## 🔧 Configuration

### Environment Variables

Update `.env` file to point to your nodes:
```env
VITE_HASHBURST_API_URL=http://31.25.11.195:8002
VITE_HASHBURST_BACKEND_URL=http://31.25.11.195:8001
VITE_IPFS_GATEWAY=http://31.25.11.195:8080/ipfs
VITE_IPFS_API=http://31.25.11.195:5001
```

### Node Configuration

Each node has its own config file:
- `server1-ubuntu/node1-config.json`
- `server2-cloudlinux/node2-config.json`
- `server2-cloudlinux/node3-config.json`

Key settings:
- `node.name`: Unique node identifier
- `node.network`: Always "mainnet"
- `node.externalIp`: Public IP address
- `p2p.bootstrapNodes`: List of other nodes to connect to
- `federation.resources`: Resources to contribute

## Monitoring

### Real-time Monitoring

Run continuous health checks:
```bash
cd deployment/monitoring
chmod +x health-check.sh
./health-check.sh &
```

View logs:
```bash
tail -f /var/log/hashburst-health.log
```

### Docker Logs

Check node logs:
```bash
# Server 1
cd /opt/hashburst
docker-compose logs -f hashburst-node-1
docker-compose logs -f ipfs-node-1

# Server 2
cd ~/hashburst
docker-compose logs -f hashburst-node-2
docker-compose logs -f hashburst-node-3
docker-compose logs -f ipfs-node-2
```

### Service Status

Check running containers:
```bash
docker-compose ps
```

Restart services:
```bash
docker-compose restart
```

Stop services:
```bash
docker-compose down
```

Start services:
```bash
docker-compose up -d
```

## Security

### Firewall Configuration

Ports opened automatically:
- **Server 1**: 80, 443, 8002, 30303, 8080, 4001, 5001
- **Server 2**: 8003, 8004, 8005, 8006, 30304, 30305, 8081, 4002, 5002

### SSL/TLS (Optional)

To enable HTTPS:

1. Install Certbot:
```bash
apt-get install certbot
```

2. Generate certificates:
```bash
certbot certonly --standalone -d your-domain.com
```

3. Update nginx.conf to use SSL certificates

### Database Security

- Supabase RLS policies are already configured
- Node data is protected by authentication
- Use environment variables for sensitive data

## Troubleshooting

### Node Won't Start

Check logs:
```bash
docker-compose logs hashburst-node-1
```

Common issues:
- Port already in use: Change port in docker-compose.yml
- Permission denied: Run with sudo
- Out of memory: Increase server RAM or reduce resource allocation

### Nodes Can't Connect to Each Other

Check P2P connectivity:
```bash
nc -zv 31.25.11.195 30303
nc -zv 85.187.128.14 30304
nc -zv 85.187.128.14 30305
```

Verify firewall:
```bash
# Ubuntu
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --list-all
```

### IPFS Node Issues

Check IPFS daemon:
```bash
docker exec -it ipfs-mainnet-node-1 ipfs swarm peers
```

Restart IPFS:
```bash
docker-compose restart ipfs-node-1
```

### Database Connection Issues

Verify Supabase credentials in `.env`:
```bash
cat .env | grep SUPABASE
```

Test connection:
```bash
npx tsx deployment/register-nodes.ts
```

## Performance Tuning

### Increase Docker Resources

Edit `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
systemctl restart docker
```

### Optimize PostgreSQL (Optional)

If using local PostgreSQL cache:
```sql
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '16MB';
SELECT pg_reload_conf();
```

### IPFS Performance

Increase connection limits:
```bash
docker exec -it ipfs-mainnet-node-1 ipfs config Swarm.ConnMgr.HighWater 900
docker exec -it ipfs-mainnet-node-1 ipfs config Swarm.ConnMgr.LowWater 600
```

## Updates and Maintenance

### Update Docker Images

```bash
docker-compose pull
docker-compose up -d
```

### Backup Data

```bash
# Backup blockchain data
tar -czf hashburst-backup-$(date +%Y%m%d).tar.gz node1-data/

# Backup IPFS data
tar -czf ipfs-backup-$(date +%Y%m%d).tar.gz ipfs1-data/
```

### Database Backup

Use Supabase dashboard to create automatic backups.

## Support

- GitHub: https://github.com/hashburst/blockchain-hvm-framework
- Documentation: See README in project root
- Issues: Create issue on GitHub repository

## Success Indicators

You know deployment is successful when:
- All 3 HashBurst nodes show "online" status
- Both IPFS nodes are accessible
- Nodes appear in web dashboard Network tab
- P2P connections show as "active"
- Can upload files through web interface
- Can view public records in blockchain
- Federation resources show correct capacity

## Next Steps

1. **Create Wallets**: Use Wallet tab to generate addresses
2. **Configure Rewards**: Set wallet addresses in node configs
3. **Upload Test Data**: Try uploading files via Upload tab
4. **Deploy Contracts**: Test smart contract deployment
5. **Monitor Network**: Keep monitoring script running
6. **Scale Up**: Add more nodes as needed

---

**Deployment Date**: ${new Date().toISOString()}
**Network**: HashBurst Mainnet
**Version**: 1.0.0
