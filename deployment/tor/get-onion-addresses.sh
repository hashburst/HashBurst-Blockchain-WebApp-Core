#!/bin/bash

# Script to retrieve all .onion addresses from Tor hidden services

echo "=================================="
echo "HashBurst .onion Addresses"
echo "=================================="
echo ""

# Check if Tor container is running
if ! docker ps | grep -q "hashburst-tor"; then
    echo "Error: Tor container is not running"
    echo "Please run ./deploy-tor.sh first"
    exit 1
fi

# Function to safely get onion address
get_onion() {
    local dir=$1
    local name=$2

    if docker exec hashburst-tor test -f "/var/lib/tor/$dir/hostname" 2>/dev/null; then
        local addr=$(docker exec hashburst-tor cat "/var/lib/tor/$dir/hostname" 2>/dev/null | tr -d '\n\r')
        if [ ! -z "$addr" ]; then
            printf "%-30s http://%s\n" "$name:" "$addr"
        fi
    fi
}

# Try to detect which server
if docker exec hashburst-tor test -d "/var/lib/tor/hashburst-node1-rpc" 2>/dev/null; then
    echo "Server 1 (.onion addresses):"
    echo "----------------------------"
    get_onion "hashburst-node1-rpc" "Node 1 RPC"
    get_onion "ipfs-gateway" "IPFS Gateway"
    get_onion "ipfs-api" "IPFS API"
    get_onion "hashburst-web" "Web Dashboard"
    get_onion "hashburst-p2p" "P2P Network"
elif docker exec hashburst-tor test -d "/var/lib/tor/hashburst-node2-rpc" 2>/dev/null; then
    echo "Server 2 (.onion addresses):"
    echo "----------------------------"
    get_onion "hashburst-node2-rpc" "Node 2 RPC"
    get_onion "hashburst-node3-rpc" "Node 3 RPC"
    get_onion "ipfs-gateway2" "IPFS Gateway 2"
    get_onion "ipfs-api2" "IPFS API 2"
    get_onion "hashburst-p2p-node2" "Node 2 P2P"
    get_onion "hashburst-p2p-node3" "Node 3 P2P"
else
    echo "No hidden services found"
    echo "Please wait a few minutes after deployment for addresses to generate"
fi

echo ""
echo "Access these addresses using Tor Browser:"
echo "  Download: https://www.torproject.org/download/"
echo ""
echo "Note: .onion addresses are only accessible via Tor network"
