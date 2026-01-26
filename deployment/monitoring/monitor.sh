#!/bin/bash

# HashBurst Network Monitoring Script

echo "================================"
echo "HashBurst Network Monitor"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_node() {
  local name=$1
  local url=$2

  echo -n "Checking $name... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/status" --max-time 5)

  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
    return 0
  else
    echo -e "${RED}✗ Offline (HTTP $response)${NC}"
    return 1
  fi
}

check_ipfs() {
  local name=$1
  local url=$2

  echo -n "Checking $name... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url/api/v0/id" --max-time 5)

  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
    return 0
  else
    echo -e "${RED}✗ Offline (HTTP $response)${NC}"
    return 1
  fi
}

echo "HashBurst Mainnet Nodes:"
echo "------------------------"
check_node "Node 1 (31.25.11.195)" "http://31.25.11.195:8002"
check_node "Node 2 (85.187.128.14)" "http://85.187.128.14:8003"
check_node "Node 3 (85.187.128.14)" "http://85.187.128.14:8005"

echo ""
echo "IPFS Nodes:"
echo "-----------"
check_ipfs "IPFS Node 1 (31.25.11.195)" "http://31.25.11.195:5001"
check_ipfs "IPFS Node 2 (85.187.128.14)" "http://85.187.128.14:5002"

echo ""
echo "Network Connectivity:"
echo "--------------------"

# Check P2P connectivity
echo -n "Testing P2P connectivity... "
if nc -zv -w 3 31.25.11.195 30303 &>/dev/null; then
  echo -e "${GREEN}✓ Node 1 P2P accessible${NC}"
else
  echo -e "${RED}✗ Node 1 P2P not accessible${NC}"
fi

if nc -zv -w 3 85.187.128.14 30304 &>/dev/null; then
  echo -e "${GREEN}✓ Node 2 P2P accessible${NC}"
else
  echo -e "${RED}✗ Node 2 P2P not accessible${NC}"
fi

if nc -zv -w 3 85.187.128.14 30305 &>/dev/null; then
  echo -e "${GREEN}✓ Node 3 P2P accessible${NC}"
else
  echo -e "${RED}✗ Node 3 P2P not accessible${NC}"
fi

echo ""
echo "Summary generated at: $(date)"
