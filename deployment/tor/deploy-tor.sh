#!/bin/bash

# HashBurst Tor Hidden Services Deployment Script
# Adds darkweb (.onion) access to HashBurst network

set -e

echo "=================================="
echo "HashBurst Tor Hidden Services"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect which server we're on
if [ -f "../server1-ubuntu/docker-compose.yml" ]; then
    SERVER="server1"
    TORRC="torrc-server1"
    COMPOSE="docker-compose-tor-server1.yml"
elif [ -f "../server2-cloudlinux/docker-compose.yml" ]; then
    SERVER="server2"
    TORRC="torrc-server2"
    COMPOSE="docker-compose-tor-server2.yml"
else
    echo -e "${YELLOW}Could not detect server. Using server1 config.${NC}"
    SERVER="server1"
    TORRC="torrc-server1"
    COMPOSE="docker-compose-tor-server1.yml"
fi

echo -e "${BLUE}Detected: $SERVER${NC}"
echo ""

echo -e "${GREEN}Step 1: Checking Tor installation...${NC}"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo -e "${GREEN}Step 2: Creating Tor directories...${NC}"

# Create directories for Tor data
mkdir -p tor-data
chmod 700 tor-data

echo -e "${GREEN}Step 3: Starting Tor hidden services...${NC}"

# Start Tor containers
docker-compose -f "$COMPOSE" up -d

echo ""
echo -e "${GREEN}Step 4: Waiting for Tor to generate .onion addresses...${NC}"
echo "This may take 1-2 minutes..."

sleep 60

echo ""
echo -e "${GREEN}Step 5: Extracting .onion addresses...${NC}"
echo ""

# Function to get onion address
get_onion_address() {
    local service_dir=$1
    local service_name=$2

    if docker exec hashburst-tor test -f "/var/lib/tor/$service_dir/hostname" 2>/dev/null; then
        local onion=$(docker exec hashburst-tor cat "/var/lib/tor/$service_dir/hostname" 2>/dev/null)
        if [ ! -z "$onion" ]; then
            echo -e "${BLUE}$service_name:${NC} http://$onion"
            echo "$service_name=$onion" >> .onion_addresses
        else
            echo -e "${YELLOW}$service_name: Generating...${NC}"
        fi
    else
        echo -e "${YELLOW}$service_name: Not ready yet${NC}"
    fi
}

# Clear previous addresses file
> .onion_addresses

if [ "$SERVER" = "server1" ]; then
    echo "Server 1 Hidden Services:"
    echo "------------------------"
    get_onion_address "hashburst-node1-rpc" "HashBurst Node 1 RPC"
    get_onion_address "ipfs-gateway" "IPFS Gateway"
    get_onion_address "ipfs-api" "IPFS API"
    get_onion_address "hashburst-web" "Web Dashboard"
    get_onion_address "hashburst-p2p" "P2P Network"
else
    echo "Server 2 Hidden Services:"
    echo "------------------------"
    get_onion_address "hashburst-node2-rpc" "HashBurst Node 2 RPC"
    get_onion_address "hashburst-node3-rpc" "HashBurst Node 3 RPC"
    get_onion_address "ipfs-gateway2" "IPFS Gateway 2"
    get_onion_address "ipfs-api2" "IPFS API 2"
    get_onion_address "hashburst-p2p-node2" "Node 2 P2P"
    get_onion_address "hashburst-p2p-node3" "Node 3 P2P"
fi

echo ""
echo -e "${GREEN}Step 6: Configuring firewall for Tor...${NC}"

# Allow Tor ports
if command -v ufw &> /dev/null; then
    ufw allow 9050/tcp  # SOCKS proxy
    ufw allow 9051/tcp  # Control port
    ufw allow 8118/tcp  # Privoxy
    echo "UFW rules added"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=9050/tcp
    firewall-cmd --permanent --add-port=9051/tcp
    firewall-cmd --permanent --add-port=8118/tcp
    firewall-cmd --reload
    echo "Firewalld rules added"
fi

echo ""
echo -e "${GREEN}✅ Tor Hidden Services Deployed!${NC}"
echo ""
echo "Your .onion addresses have been saved to: .onion_addresses"
echo ""
echo "Access via Tor Browser:"
echo "  1. Download Tor Browser: https://www.torproject.org/download/"
echo "  2. Open Tor Browser"
echo "  3. Navigate to your .onion addresses"
echo ""
echo "Notes:"
echo "  - .onion addresses are only accessible via Tor"
echo "  - It may take a few minutes for addresses to propagate"
echo "  - All connections are end-to-end encrypted"
echo "  - Your clearnet services remain accessible"
echo ""
echo "To view your .onion addresses anytime:"
echo "  cat .onion_addresses"
echo ""
echo "To check Tor status:"
echo "  docker-compose -f $COMPOSE ps"
echo ""
echo "To view Tor logs:"
echo "  docker-compose -f $COMPOSE logs -f tor"
