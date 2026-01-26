# HashBurst Darkweb Access via Tor

Complete guide to accessing HashBurst blockchain network via Tor hidden services (.onion domains) for maximum privacy and censorship resistance.

## What is Tor Access?

Tor (The Onion Router) provides:
- **Complete Anonymity**: Hide your IP address and location
- **Censorship Resistance**: Access blocked in your country
- **End-to-End Encryption**: All traffic encrypted through Tor network
- **No DNS Leaks**: .onion domains bypass DNS entirely
- **Privacy**: No tracking, no logs, completely anonymous

## HashBurst .onion Services

### Server 1 Hidden Services
- **Node 1 RPC**: `http://[generated].onion`
- **IPFS Gateway**: `http://[generated].onion`
- **IPFS API**: `http://[generated].onion`
- **Web Dashboard**: `http://[generated].onion`
- **P2P Network**: `[generated].onion:30303`

### Server 2 Hidden Services
- **Node 2 RPC**: `http://[generated].onion`
- **Node 3 RPC**: `http://[generated].onion`
- **IPFS Gateway 2**: `http://[generated].onion`
- **IPFS API 2**: `http://[generated].onion`
- **Node 2 P2P**: `[generated].onion:30303`
- **Node 3 P2P**: `[generated].onion:30303`

## Quick Start for Users

### Step 1: Download Tor Browser

**Windows / macOS / Linux**:
1. Visit: https://www.torproject.org/download/
2. Download Tor Browser for your OS
3. Install and run Tor Browser

**Android**:
- Download from: https://www.torproject.org/download/#android

**iOS**:
- Download Onion Browser from App Store

### Step 2: Connect to Tor

1. Open Tor Browser
2. Click "Connect" (or "Configure" if in restricted country)
3. Wait for connection (usually 10-20 seconds)
4. Verify connected (check "Tor Browser" in address bar)

### Step 3: Access HashBurst

1. Get the .onion address from your administrator
2. Enter the .onion URL in Tor Browser
3. HashBurst dashboard will load (may take 15-30 seconds first time)
4. Use normally - everything is anonymous!

## Deployment (Administrators)

### Deploy Tor Hidden Services

**Server 1**:
```bash
ssh root@31.25.11.195
cd /opt/hashburst/deployment/tor
chmod +x deploy-tor.sh
./deploy-tor.sh
```

**Server 2**:
```bash
ssh hashburs@85.187.128.14
cd ~/hashburst/deployment/tor
chmod +x deploy-tor.sh
./deploy-tor.sh
```

### Retrieve .onion Addresses

```bash
cd deployment/tor
./get-onion-addresses.sh
```

Or directly:
```bash
cat .onion_addresses
```

### Share Addresses

Create a secure document with your .onion addresses:
```bash
echo "HashBurst Darkweb Access" > onion-access.txt
echo "=======================" >> onion-access.txt
echo "" >> onion-access.txt
cat .onion_addresses >> onion-access.txt
echo "" >> onion-access.txt
echo "Use Tor Browser: https://www.torproject.org/download/" >> onion-access.txt
```

## Advanced Configuration

### Custom Tor Configuration

Edit `torrc-server1` or `torrc-server2`:

```
# Add custom settings
HiddenServicePort 80 127.0.0.1:8080

# Limit connections
MaxCircuitDirtiness 600

# Use bridges for extra security
UseBridges 1
Bridge obfs4 [bridge-address]
```

Restart Tor:
```bash
docker-compose -f docker-compose-tor-server1.yml restart tor
```

### Enable Tor for All Outbound Connections

Configure nodes to route through Tor:

Edit node config:
```json
{
  "network": {
    "proxy": "socks5://tor:9050",
    "onionOnly": true
  }
}
```

### Multiple Onion Addresses

Add to torrc:
```
HiddenServiceDir /var/lib/tor/my-service/
HiddenServicePort 80 my-app:8080
```

## Security Best Practices

### For Administrators

1. **Keep .onion addresses private**: Only share with trusted users
2. **Regular updates**: Keep Tor updated
3. **Monitor logs**: Check for suspicious activity
4. **Backup keys**: Save `/var/lib/tor/**/hs_ed25519_secret_key`
5. **Use authentication**: Consider HiddenServiceAuthorizeClient

### For Users

1. **Only use Tor Browser**: Don't access .onion in regular browsers
2. **Verify addresses**: Always verify .onion URL before entering data
3. **No personal info**: Don't enter identifying information
4. **Use VPN + Tor**: Extra layer (optional)
5. **Keep Tor updated**: Always use latest Tor Browser

## Performance Considerations

### Expected Speeds
- **Loading time**: 15-30 seconds initially
- **Throughput**: 50-200 KB/s (slower than clearnet)
- **Latency**: 300-1000ms (higher than clearnet)

### Optimization Tips
1. Use smaller files when possible
2. Enable caching in Tor Browser
3. Increase circuit timeout if needed
4. Use multiple Tor circuits for parallel downloads

### Why Is It Slower?
- Traffic routes through 3+ nodes
- Each hop adds encryption
- Network congestion
- Limited bandwidth per circuit

This is the tradeoff for complete anonymity!

## Access from Restricted Countries

### Using Bridges

If Tor is blocked in your country:

1. Get bridges from: https://bridges.torproject.org/
2. Or email: bridges@torproject.org
3. Configure in Tor Browser settings
4. Select "obfs4" bridge type

### Alternative Methods

**Snowflake**:
- Uses temporary proxies
- Built into Tor Browser
- Enable in settings

**VPN + Tor**:
1. Connect to VPN first
2. Then connect to Tor
3. Access .onion addresses

## Maintaining Hidden Services

### Check Tor Status
```bash
docker-compose -f docker-compose-tor-server1.yml ps
```

### View Tor Logs
```bash
docker-compose -f docker-compose-tor-server1.yml logs -f tor
```

### Restart Tor
```bash
docker-compose -f docker-compose-tor-server1.yml restart tor
```

### Regenerate .onion Address

This will change your .onion domain!

```bash
docker-compose down
rm -rf tor-data/*
docker-compose up -d
./get-onion-addresses.sh
```

### Backup Hidden Service Keys

```bash
# Important! Backup these keys to preserve your .onion address
docker cp hashburst-tor:/var/lib/tor tor-backup/
tar -czf tor-keys-backup-$(date +%Y%m%d).tar.gz tor-backup/

# Store securely offline
```

### Restore Hidden Service Keys

```bash
# Extract backup
tar -xzf tor-keys-backup-YYYYMMDD.tar.gz

# Restore
docker cp tor-backup/. hashburst-tor:/var/lib/tor/
docker-compose restart tor
```

## Testing Your Setup

### Test from Command Line

```bash
# Install torsocks
apt-get install torsocks  # Ubuntu/Debian
yum install torsocks      # CentOS/RHEL

# Test access
torsocks curl http://your-onion-address.onion
```

### Test in Tor Browser

1. Open Tor Browser
2. Navigate to: http://your-onion-address.onion
3. Should see HashBurst dashboard
4. Try uploading a file
5. Check records tab

### Verify Anonymity

1. Visit: https://check.torproject.org/
2. Should say "Congratulations! This browser is configured to use Tor"
3. Your IP should NOT be your real IP

## Troubleshooting

### .onion Address Not Working

**Check Tor is running**:
```bash
docker ps | grep tor
```

**Check .onion was generated**:
```bash
./get-onion-addresses.sh
```

**Wait longer**:
- Can take 2-3 minutes to propagate
- Try again in 5 minutes

### Tor Browser Can't Connect

**Try a bridge**:
1. Settings → Tor
2. Enable bridges
3. Request obfs4 bridges

**Check firewall**:
```bash
ufw allow 9050/tcp
```

**Restart Tor**:
```bash
docker-compose restart tor
```

### Slow Performance

**Normal for Tor**:
- Expected 200-500ms latency
- Throughput: 50-200 KB/s

**Optimize**:
```bash
# Increase circuit lifetime
echo "MaxCircuitDirtiness 3600" >> torrc-server1
docker-compose restart tor
```

### Service Unreachable

**Check backend is running**:
```bash
docker ps
docker-compose logs hashburst-node-1
```

**Verify Tor routing**:
```bash
docker exec -it hashburst-tor cat /var/lib/tor/hashburst-node1-rpc/hostname
```

## Mobile Access

### Android

1. Install Tor Browser for Android
2. Open browser
3. Navigate to .onion URL
4. Full functionality available

### iOS

1. Install Onion Browser from App Store
2. Open browser
3. Navigate to .onion URL
4. Limited functionality (no WebRTC)

## Combining Clearnet and Darkweb

Users can access HashBurst via:
- **Clearnet**: http://31.25.11.195:8002 (normal internet)
- **Darkweb**: http://[your].onion (via Tor)

Both access the same blockchain network!

### Benefits of Dual Access

- **Redundancy**: If one is blocked, use the other
- **Flexibility**: Users choose their preference
- **Privacy options**: Anonymous or identified access
- **Censorship resistance**: Always accessible somewhere

## Additional Resources

- **Tor Project**: https://www.torproject.org/
- **Tor Browser Manual**: https://tb-manual.torproject.org/
- **Onion Services**: https://community.torproject.org/onion-services/
- **Security Best Practices**: https://www.torproject.org/download/download.html.en#warning

## Legal Notice

Using Tor is legal in most countries. However:
- Check your local laws
- Some countries restrict or monitor Tor usage
- Use responsibly and ethically
- Don't use for illegal activities

HashBurst provides Tor access for:
- Privacy-conscious users
- Censorship circumvention
- Anonymous blockchain access
- Decentralization goals

---

**Security Level**: Maximum
**Anonymity**: Complete
**Censorship Resistance**: Excellent
**Setup Difficulty**: Easy (for users), Medium (for admins)

**Welcome to the Darkweb HashBurst Network!**
