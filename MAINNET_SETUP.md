# HashBurst Mainnet Setup Guide

Complete guide to deploy and run the HashBurst mainnet across your two servers.

## Server Information

### Server 1: Ubuntu 24.04 VPS
- **IP**: 31.25.11.195
- **Nodes**: 1 HashBurst Node + 1 IPFS Node
- **Role**: Primary validator and gateway

### Server 2: CloudLinux 7.9
- **IP**: 85.187.128.14
- **Nodes**: 2 HashBurst Nodes + 1 IPFS Node
- **Role**: Additional validators and redundancy

## ⚡ Quick Start (5 Steps)

### Deploy Server 1 (5 minutes)

```bash
# SSH into server
ssh root@31.25.11.195

# Create directory
mkdir -p /opt/hashburst && cd /opt/hashburst

# Copy deployment files (from your local machine in another terminal)
# scp -r deployment/server1-ubuntu/* root@31.25.11.195:/opt/hashburst/

# Run deployment
chmod +x deploy.sh
sudo ./deploy.sh
```

Wait for completion. You should see:
```
Deployment Complete!

Node Information:
  - HashBurst RPC: http://31.25.11.195:8002
  - IPFS Gateway: http://31.25.11.195:8080
```

### Deploy Server 2 (5 minutes)

```bash
# SSH into server
ssh hashburs@85.187.128.14

# Create directory
mkdir -p ~/hashburst && cd ~/hashburst

# Copy deployment files (from your local machine in another terminal)
# scp -r deployment/server2-cloudlinux/* hashburs@85.187.128.14:~/hashburst/

# Run deployment
chmod +x deploy.sh
sudo ./deploy.sh
```

Wait for completion. You should see:
```
Deployment Complete!

Node Information:
  Node 2: http://85.187.128.14:8003
  Node 3: http://85.187.128.14:8005
  IPFS: http://85.187.128.14:8081
```

### Register Nodes (1 minute)

From your **local development machine**:

```bash
# Install dependencies (if not done)
npm install

# Register all nodes in database
npm run deploy:register
```

You should see:
```
Registering HashBurst Mainnet Nodes...
Node 1 registered
Node 2 registered
Node 3 registered
IPFS nodes registered
Registration Complete!
```

### Verify Network (1 minute)

```bash
# Run monitoring script
npm run deploy:monitor
```

Expected output:
```
HashBurst Mainnet Nodes:
✓ Node 1 (31.25.11.195)... Online
✓ Node 2 (85.187.128.14)... Online
✓ Node 3 (85.187.128.14)... Online

IPFS Nodes:
✓ IPFS Node 1... Online
✓ IPFS Node 2... Online
```

### Access Web Dashboard

```bash
# Start development server
npm run dev
```

Open browser: `http://localhost:5173`

Navigate to:
- **Network Tab** → See all 3 nodes live
- **Federation Tab** → View federated resources
- **Dashboard** → Monitor real-time stats

## What You Get

After successful deployment:

**3 Blockchain Nodes** running and interconnected
**2 IPFS Nodes** for distributed storage
**P2P Network** with automatic peer discovery
**Web Dashboard** to manage everything
**Resource Federation** ready to earn rewards
**Public Record System** operational
**Smart Contracts** deployment ready

## Network Endpoints

### Mainnet Nodes

| Node | RPC Endpoint | P2P Port | Server |
|------|-------------|----------|---------|
| Node 1 | http://31.25.11.195:8002 | 30303 | Server 1 |
| Node 2 | http://85.187.128.14:8003 | 30304 | Server 2 |
| Node 3 | http://85.187.128.14:8005 | 30305 | Server 2 |

### IPFS Nodes

| Node | Gateway | API | Swarm | Server |
|------|---------|-----|-------|---------|
| IPFS 1 | http://31.25.11.195:8080 | 5001 | 4001 | Server 1 |
| IPFS 2 | http://85.187.128.14:8081 | 5002 | 4002 | Server 2 |

## Testing Your Deployment

### Test Blockchain Nodes

```bash
# Test Node 1
curl http://31.25.11.195:8002/api/status | jq

# Test Node 2
curl http://85.187.128.14:8003/api/status | jq

# Test Node 3
curl http://85.187.128.14:8005/api/status | jq
```

### Test IPFS Nodes

```bash
# Test IPFS Node 1
curl http://31.25.11.195:5001/api/v0/id | jq

# Test IPFS Node 2
curl http://85.187.128.14:5002/api/v0/id | jq
```

### Upload a Test File

1. Go to **Upload Tab** in web dashboard
2. Drag and drop a file
3. Click "Upload to IPFS & Blockchain"
4. Check **Records Tab** to see your file recorded

### View Network Status

1. Go to **Network Tab**
2. You should see all 3 nodes listed as "Online"
3. Check P2P connections status
4. View node statistics

## Management

### View Logs

```bash
# Server 1
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose logs -f

# Server 2
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose logs -f
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart hashburst-node-1
```

### Stop/Start Network

```bash
# Stop
docker-compose down

# Start
docker-compose up -d
```

### Monitor Continuously

```bash
# Run health check (keeps monitoring)
npm run deploy:health &

# View health log
tail -f /var/log/hashburst-health.log
```

## Earning Rewards

### 1. Create a Wallet

- Go to **Wallet Tab**
- Click "Create Wallet"
- Name it and download backup
- Copy your wallet address

### 2. Configure Node Rewards

Edit node config files to add your wallet:

**Server 1**: `/opt/hashburst/node1-config.json`
```json
{
  "wallet": {
    "rewardAddress": "YOUR_WALLET_ADDRESS_HERE"
  }
}
```

**Server 2**: `~/hashburst/node2-config.json` and `node3-config.json`

Restart nodes after updating:
```bash
docker-compose restart
```

### 3. Start Earning

Rewards are earned by:
- Validating transactions
- Hosting IPFS files
- Providing compute resources
- Maintaining uptime

Check rewards in **Federation Tab** → "Rewards Distributed"

## Troubleshooting

### Node Won't Start

```bash
# Check logs
docker-compose logs hashburst-node-1

# Check disk space
df -h

# Check memory
free -m

# Restart Docker
systemctl restart docker
docker-compose up -d
```

### Nodes Can't Connect

```bash
# Check firewall
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS

# Test P2P connectivity
nc -zv 31.25.11.195 30303
nc -zv 85.187.128.14 30304
```

### IPFS Issues

```bash
# Check IPFS status
docker exec -it ipfs-mainnet-node-1 ipfs swarm peers

# Check IPFS config
docker exec -it ipfs-mainnet-node-1 ipfs config show

# Restart IPFS
docker-compose restart ipfs-node-1
```

### Database Not Syncing

```bash
# Re-run registration
npm run deploy:register

# Check database credentials
cat .env | grep SUPABASE
```

## Performance Tips

### Optimize Resources

Each node should have:
- **Minimum**: 2GB RAM, 2 CPU cores, 50GB storage
- **Recommended**: 4GB RAM, 4 CPU cores, 100GB storage
- **Optimal**: 8GB RAM, 8 CPU cores, 500GB storage

### Increase Connections

```bash
# Edit docker-compose.yml
# Increase max_connections for better performance
```

### Enable Caching

The nginx reverse proxy on Server 1 provides caching for improved performance.

## Security Checklist

Firewall configured on both servers
Supabase RLS policies active
Docker containers isolated
No private keys in configs
HTTPS ready (configure SSL as needed)
Regular backups scheduled

## Backup Strategy

### Blockchain Data

```bash
# Server 1
cd /opt/hashburst
tar -czf backup-$(date +%Y%m%d).tar.gz node1-data/

# Server 2
cd ~/hashburst
tar -czf backup-$(date +%Y%m%d).tar.gz node2-data/ node3-data/
```

### Database

Use Supabase dashboard:
1. Go to Settings → Backups
2. Enable automatic daily backups
3. Store backups securely

## Next Steps

1. **Test Upload**: Upload files via web interface
2. **Deploy Contract**: Try smart contract deployment
3. **Create Wallet**: Generate and backup wallet
4. **Monitor Network**: Keep health check running
5. **Invite Users**: Share the web app URL
6. **Scale Up**: Add more nodes as needed

## Learn More

- **Full Documentation**: [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)
- **API Reference**: Check node endpoints above
- **GitHub**: https://github.com/hashburst/blockchain-hvm-framework

## Success Checklist

Your mainnet is ready when you can check all these:

- [ ] All 3 HashBurst nodes show "Online" in Network tab
- [ ] Both IPFS nodes accessible
- [ ] Can upload files through web interface
- [ ] Files appear in Records tab
- [ ] Can create and backup wallets
- [ ] Can deploy smart contracts
- [ ] P2P connections active
- [ ] Federation resources showing
- [ ] Monitoring script shows all green
- [ ] No errors in docker logs

## Congratulations!

You now have a fully operational HashBurst mainnet with:
- 3 interconnected blockchain nodes
- 2 distributed IPFS storage nodes
- Complete P2P trustless network
- Web dashboard for management
- Resource federation enabled
- Public record keeping active

**Welcome to the HashBurst Mainnet!** 🚀

---

**Need Help?**
- Check logs: `docker-compose logs`
- Run monitor: `npm run deploy:monitor`
- Full guide: `deployment/DEPLOYMENT.md`
