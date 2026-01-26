# HashBurst Mainnet - Copy & Paste Deployment Commands

Quick reference for deploying HashBurst mainnet. Just copy and paste these commands!

## Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] SSH access to both servers
- [ ] Root/sudo privileges
- [ ] Ports 8002, 30303, 8080, 4001, 5001 available on Server 1
- [ ] Ports 8003-8006, 30304-30305, 8081, 4002, 5002 available on Server 2
- [ ] At least 50GB free disk space on each server
- [ ] At least 4GB RAM on each server

## Server 1: Ubuntu 24.04 VPS (31.25.11.195)

### Step 1: SSH into Server 1
```bash
ssh root@31.25.11.195
```

### Step 2: Create Directory
```bash
mkdir -p /opt/hashburst && cd /opt/hashburst
```

### Step 3: Upload Files
From your **local machine** in a new terminal:
```bash
cd /path/to/hashburst/project
scp -r deployment/server1-ubuntu/* root@31.25.11.195:/opt/hashburst/
```

### Step 4: Deploy (back in server SSH)
```bash
cd /opt/hashburst
chmod +x deploy.sh
sudo ./deploy.sh
```

Wait 3-5 minutes for deployment to complete.

### Step 5: Verify
```bash
docker-compose ps
curl http://localhost:8002/api/status
```

Expected: All containers "Up" and status response from curl.

---

## Server 2: CloudLinux (85.187.128.14)

### Step 1: SSH into Server 2
```bash
ssh hashburs@85.187.128.14
```

### Step 2: Create Directory
```bash
mkdir -p ~/hashburst && cd ~/hashburst
```

### Step 3: Upload Files
From your **local machine** in a new terminal:
```bash
cd /path/to/hashburst/project
scp -r deployment/server2-cloudlinux/* hashburs@85.187.128.14:~/hashburst/
```

### Step 4: Deploy (back in server SSH)
```bash
cd ~/hashburst
chmod +x deploy.sh
sudo ./deploy.sh
```

Wait 3-5 minutes for deployment to complete.

### Step 5: Verify
```bash
docker-compose ps
curl http://localhost:8003/api/status
curl http://localhost:8005/api/status
```

Expected: All containers "Up" and status responses from both curls.

---

## Local Machine: Register Nodes

### Step 1: Navigate to Project
```bash
cd /path/to/hashburst/project
```

### Step 2: Install Dependencies (if not done)
```bash
npm install
```

### Step 3: Register Nodes in Database
```bash
npm run deploy:register
```

Expected output:
```
Registering HashBurst Mainnet Nodes...
Node 1 registered
Node 2 registered
Node 3 registered
IPFS nodes registered
Registration Complete!
```

### Step 4: Monitor Network
```bash
npm run deploy:monitor
```

Expected: All nodes showing ✓ Online

### Step 5: Start Web Dashboard
```bash
npm run dev
```

Open browser: http://localhost:5173

---

## Verification Commands

### Check All Nodes from Local Machine
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

### Check P2P Connectivity
```bash
# Test P2P ports
nc -zv 31.25.11.195 30303
nc -zv 85.187.128.14 30304
nc -zv 85.187.128.14 30305
```

### Check Docker Status (on servers)
```bash
# On Server 1
docker-compose ps
docker-compose logs --tail=50

# On Server 2
docker-compose ps
docker-compose logs --tail=50
```

---

## 🔧 Management Commands

### Restart Services

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose restart
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose restart
```

### Stop Services

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose down
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose down
```

### Start Services

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose up -d
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose up -d
```

### View Live Logs

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose logs -f
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose logs -f
```

### View Specific Service Logs

**Server 1**:
```bash
# HashBurst Node 1
docker-compose logs -f hashburst-node-1

# IPFS Node 1
docker-compose logs -f ipfs-node-1
```

**Server 2**:
```bash
# HashBurst Node 2
docker-compose logs -f hashburst-node-2

# HashBurst Node 3
docker-compose logs -f hashburst-node-3

# IPFS Node 2
docker-compose logs -f ipfs-node-2
```

---

## Update Commands

### Update Docker Images

**Server 1**:
```bash
cd /opt/hashburst
docker-compose pull
docker-compose up -d
```

**Server 2**:
```bash
cd ~/hashburst
docker-compose pull
docker-compose up -d
```

### Rebuild Containers

**Server 1**:
```bash
cd /opt/hashburst
docker-compose down
docker-compose up -d --build
```

**Server 2**:
```bash
cd ~/hashburst
docker-compose down
docker-compose up -d --build
```

---

## Monitoring Commands

### Continuous Network Monitoring (Local)
```bash
cd /path/to/hashburst/project
npm run deploy:health &
```

### View Monitoring Log
```bash
tail -f /var/log/hashburst-health.log
```

### Quick Network Status
```bash
npm run deploy:monitor
```

### Check Disk Space (Servers)

**Server 1**:
```bash
ssh root@31.25.11.195 "df -h"
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14 "df -h"
```

### Check Memory Usage (Servers)

**Server 1**:
```bash
ssh root@31.25.11.195 "free -h"
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14 "free -h"
```

---

## Backup Commands

### Backup Blockchain Data

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
tar -czf hashburst-backup-$(date +%Y%m%d).tar.gz node1-data/
# Download backup
scp root@31.25.11.195:/opt/hashburst/hashburst-backup-*.tar.gz ./backups/
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
tar -czf hashburst-backup-$(date +%Y%m%d).tar.gz node2-data/ node3-data/
# Download backup
scp hashburs@85.187.128.14:~/hashburst/hashburst-backup-*.tar.gz ./backups/
```

### Backup IPFS Data

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
tar -czf ipfs-backup-$(date +%Y%m%d).tar.gz ipfs1-data/
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
tar -czf ipfs-backup-$(date +%Y%m%d).tar.gz ipfs2-data/
```

---

## Troubleshooting Commands

### Check Firewall Status

**Server 1 (Ubuntu)**:
```bash
ssh root@31.25.11.195 "sudo ufw status"
```

**Server 2 (may vary)**:
```bash
ssh hashburs@85.187.128.14 "sudo firewall-cmd --list-all || sudo ufw status || sudo iptables -L"
```

### Restart Docker Daemon

**Server 1**:
```bash
ssh root@31.25.11.195 "sudo systemctl restart docker"
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14 "sudo systemctl restart docker"
```

### Check Container Health

**Server 1**:
```bash
ssh root@31.25.11.195 "cd /opt/hashburst && docker-compose ps"
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14 "cd ~/hashburst && docker-compose ps"
```

### Force Remove and Recreate

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst
docker-compose down -v
docker-compose up -d
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst
docker-compose down -v
docker-compose up -d
```

Warning: This will delete all data!

---

## Quick Access URLs

### Blockchain RPC Endpoints
- Node 1: http://31.25.11.195:8002
- Node 2: http://85.187.128.14:8003
- Node 3: http://85.187.128.14:8005

### IPFS Gateways
- IPFS 1: http://31.25.11.195:8080
- IPFS 2: http://85.187.128.14:8081

### IPFS APIs
- IPFS 1 API: http://31.25.11.195:5001
- IPFS 2 API: http://85.187.128.14:5002

### Web Dashboard
- Local: http://localhost:5173

---

## One-Liner Commands

### Deploy Everything (Semi-Automated)
```bash
# Server 1
ssh root@31.25.11.195 'mkdir -p /opt/hashburst && cd /opt/hashburst && curl -O [deployment-script-url] && chmod +x deploy.sh && ./deploy.sh'

# Server 2
ssh hashburs@85.187.128.14 'mkdir -p ~/hashburst && cd ~/hashburst && curl -O [deployment-script-url] && chmod +x deploy.sh && ./deploy.sh'

# Local
npm run deploy:register && npm run deploy:monitor && npm run dev
```

### Check All Nodes Status
```bash
for node in "31.25.11.195:8002" "85.187.128.14:8003" "85.187.128.14:8005"; do
  echo "Checking $node..."
  curl -s "http://$node/api/status" | jq -r '.status // "offline"'
done
```

### Restart All Nodes
```bash
ssh root@31.25.11.195 'cd /opt/hashburst && docker-compose restart' && \
ssh hashburs@85.187.128.14 'cd ~/hashburst && docker-compose restart'
```

---

## Success Indicators

After deployment, you should see:

**Server Logs**:
```
Deployment Complete!
Node Information:
  - HashBurst RPC: http://[IP]:[PORT]
```

**Monitoring Output**:
```
✓ Node 1... Online
✓ Node 2... Online
✓ Node 3... Online
✓ IPFS Node 1... Online
✓ IPFS Node 2... Online
```

**Web Dashboard**:
- Network tab shows 3 nodes
- All nodes status: "Online"
- P2P connections: "Active"
- Can upload files
- Records appear in blockchain

---

**Need Help?** See [MAINNET_SETUP.md](MAINNET_SETUP.md) for detailed instructions.
