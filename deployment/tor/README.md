# HashBurst Tor Hidden Services

Enable darkweb access to HashBurst blockchain network via Tor (.onion domains).

## Quick Start

### For Users

1. **Download Tor Browser**: https://www.torproject.org/download/
2. **Connect to Tor**: Open browser and click "Connect"
3. **Access HashBurst**: Navigate to your .onion address
4. **Use Normally**: All features work via Tor

### For Administrators

```bash
# Deploy Tor hidden services
./deploy-tor.sh

# Get .onion addresses
./get-onion-addresses.sh

# View addresses anytime
cat .onion_addresses
```

## Files

- `torrc-server1` - Tor configuration for Server 1
- `torrc-server2` - Tor configuration for Server 2
- `docker-compose-tor-server1.yml` - Docker Compose for Server 1
- `docker-compose-tor-server2.yml` - Docker Compose for Server 2
- `deploy-tor.sh` - Automated deployment script
- `get-onion-addresses.sh` - Retrieve .onion addresses
- `TOR_ACCESS_GUIDE.md` - Complete documentation

## What You Get

### Server 1 Hidden Services
- HashBurst Node 1 RPC → `.onion:80`
- IPFS Gateway → `.onion:80`
- IPFS API → `.onion:80`
- Web Dashboard → `.onion:80`
- P2P Network → `.onion:30303`

### Server 2 Hidden Services
- HashBurst Node 2 RPC → `.onion:80`
- HashBurst Node 3 RPC → `.onion:80`
- IPFS Gateway 2 → `.onion:80`
- IPFS API 2 → `.onion:80`
- Node 2 P2P → `.onion:30303`
- Node 3 P2P → `.onion:30303`

## Deployment

### Server 1 (Ubuntu)

```bash
ssh root@31.25.11.195
cd /opt/hashburst/deployment/tor

# Copy Tor files
# (files should already be present from initial deployment)

# Deploy Tor
chmod +x deploy-tor.sh
./deploy-tor.sh

# Wait 1-2 minutes for .onion address generation

# Get addresses
./get-onion-addresses.sh
```

### Server 2 (CloudLinux 7.9)

```bash
ssh hashburs@85.187.128.14
cd ~/hashburst/deployment/tor

# Deploy Tor
chmod +x deploy-tor.sh
sudo ./deploy-tor.sh

# Get addresses
./get-onion-addresses.sh
```

## Verification

### Check Tor Status

```bash
docker-compose -f docker-compose-tor-server1.yml ps
```

Expected output:
```
NAME                 STATUS
hashburst-tor        Up (healthy)
hashburst-tor-proxy  Up
```

### View Tor Logs

```bash
docker-compose -f docker-compose-tor-server1.yml logs -f tor
```

### Test Hidden Service

```bash
# Install torsocks
apt-get install torsocks

# Test access
torsocks curl http://your-onion-address.onion
```

## Management

### Start Tor

```bash
docker-compose -f docker-compose-tor-server1.yml up -d
```

### Stop Tor

```bash
docker-compose -f docker-compose-tor-server1.yml down
```

### Restart Tor

```bash
docker-compose -f docker-compose-tor-server1.yml restart tor
```

### Update Tor

```bash
docker-compose -f docker-compose-tor-server1.yml pull tor
docker-compose -f docker-compose-tor-server1.yml up -d tor
```

## Security

### Backup Hidden Service Keys

**Important**: These keys determine your .onion address!

```bash
# Backup
docker cp hashburst-tor:/var/lib/tor/hashburst-node1-rpc tor-backup/
tar -czf tor-keys-$(date +%Y%m%d).tar.gz tor-backup/

# Store securely offline!
```

### Restore Hidden Service Keys

```bash
# Extract backup
tar -xzf tor-keys-YYYYMMDD.tar.gz

# Restore
docker cp tor-backup/. hashburst-tor:/var/lib/tor/hashburst-node1-rpc/
docker-compose restart tor
```

### Change .onion Address

This will generate a NEW .onion address!

```bash
docker-compose down
rm -rf tor-data/*
docker-compose up -d
```

## Access Methods

### Via Tor Browser (Recommended)

1. Download: https://www.torproject.org/download/
2. Open Tor Browser
3. Navigate to: `http://your-onion-address.onion`

### Via Command Line

```bash
# Install torsocks
apt-get install torsocks

# Use with curl
torsocks curl http://your-onion-address.onion/api/status

# Use with any command
torsocks [command]
```

### Via SOCKS Proxy

Configure your application to use:
- **SOCKS5 Proxy**: `localhost:9050`
- **HTTP Proxy**: `localhost:8118` (via Privoxy)

## Troubleshooting

### .onion Address Not Generated

**Wait longer**: Can take 2-3 minutes
```bash
# Check every 30 seconds
watch -n 30 './get-onion-addresses.sh'
```

**Check Tor logs**:
```bash
docker-compose logs tor
```

### Hidden Service Not Accessible

**Check backend is running**:
```bash
docker ps | grep hashburst-node
```

**Verify Tor routing**:
```bash
docker exec hashburst-tor cat /var/lib/tor/hashburst-node1-rpc/hostname
```

**Test locally**:
```bash
torsocks curl http://$(docker exec hashburst-tor cat /var/lib/tor/hashburst-node1-rpc/hostname)
```

### Slow Performance

**Normal for Tor**:
- Latency: 300-1000ms
- Throughput: 50-200 KB/s

**Optimize**:
```bash
# Increase circuit lifetime
echo "MaxCircuitDirtiness 3600" >> torrc-server1
docker-compose restart tor
```

### Tor Won't Start

**Check ports**:
```bash
netstat -tlnp | grep 9050
```

**Clear data and restart**:
```bash
docker-compose down
rm -rf tor-data/*
docker-compose up -d
```

## Documentation

- **Complete Guide**: [TOR_ACCESS_GUIDE.md](TOR_ACCESS_GUIDE.md)
- **Tor Project**: https://www.torproject.org/
- **Hidden Services**: https://community.torproject.org/onion-services/

## Best Practices

### For Administrators

1. Backup .onion keys regularly
2. Monitor Tor logs
3. Keep Tor updated
4. Use authentication for sensitive services
5. Test accessibility regularly

### For Users

1. Only use Tor Browser
2. Verify .onion addresses
3. Don't enter personal info
4. Keep Tor Browser updated
5. Use bridges if Tor is blocked

## ⚡ Quick Commands

```bash
# Deploy Tor
./deploy-tor.sh

# Get addresses
./get-onion-addresses.sh

# Check status
docker-compose -f docker-compose-tor-server1.yml ps

# View logs
docker-compose -f docker-compose-tor-server1.yml logs -f

# Restart
docker-compose -f docker-compose-tor-server1.yml restart

# Stop
docker-compose -f docker-compose-tor-server1.yml down
```

## Links

- Tor Browser: https://www.torproject.org/download/
- Tor Documentation: https://tb-manual.torproject.org/
- Check Tor: https://check.torproject.org/

---

**Privacy**: Maximum
**Anonymity**: Complete
**Censorship Resistance**: Excellent
**Setup Time**: 5 minutes

**Welcome to the Darkweb HashBurst Network!**
