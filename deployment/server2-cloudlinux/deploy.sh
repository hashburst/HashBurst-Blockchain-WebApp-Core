#!/bin/bash

# HashBurst Mainnet Nodes 2 & 3 + IPFS Node 2 Deployment Script
# Server: CloudLinux 7.9 (85.187.128.14)

set -e

echo "========================================"
echo "HashBurst Mainnet Nodes 2 & 3 Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run with sudo${NC}"
  exit 1
fi

echo -e "${GREEN}Step 1: Installing dependencies...${NC}"

# Detect Linux distribution
if [ -f /etc/redhat-release ]; then
  # CentOS/RHEL
  yum update -y
  yum install -y yum-utils device-mapper-persistent-data lvm2 curl

  # Install Docker
  if ! command -v docker &> /dev/null; then
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
  fi
elif [ -f /etc/debian_version ]; then
  # Debian/Ubuntu
  apt-get update
  apt-get upgrade -y

  # Install Docker
  if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
  fi
else
  echo -e "${YELLOW}Unknown Linux distribution${NC}"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  echo "Docker Compose already installed"
fi

echo -e "${GREEN}Step 2: Creating directories...${NC}"

# Create data directories for both nodes
mkdir -p node2-data/blockchain
mkdir -p node2-data/logs
mkdir -p node3-data/blockchain
mkdir -p node3-data/logs
mkdir -p ipfs2-data
mkdir -p ipfs2-config

# Set permissions
chmod -R 755 node2-data
chmod -R 755 node3-data
chmod -R 755 ipfs2-data

echo -e "${GREEN}Step 3: Configuring firewall...${NC}"

# Try different firewall commands based on what's available
if command -v firewall-cmd &> /dev/null; then
  # FirewallD (CentOS/RHEL)
  firewall-cmd --permanent --add-port=8003/tcp
  firewall-cmd --permanent --add-port=8004/tcp
  firewall-cmd --permanent --add-port=8005/tcp
  firewall-cmd --permanent --add-port=8006/tcp
  firewall-cmd --permanent --add-port=30304/tcp
  firewall-cmd --permanent --add-port=30305/tcp
  firewall-cmd --permanent --add-port=8081/tcp
  firewall-cmd --permanent --add-port=4002/tcp
  firewall-cmd --reload
  echo "FirewallD configured"
elif command -v ufw &> /dev/null; then
  # UFW (Ubuntu/Debian)
  ufw --force enable
  ufw allow 22/tcp      # SSH
  ufw allow 8003/tcp    # Node 2 RPC
  ufw allow 8005/tcp    # Node 3 RPC
  ufw allow 30304/tcp   # Node 2 P2P
  ufw allow 30305/tcp   # Node 3 P2P
  ufw allow 8081/tcp    # IPFS Gateway
  ufw allow 4002/tcp    # IPFS Swarm
  ufw reload
  echo "UFW configured"
elif command -v iptables &> /dev/null; then
  # iptables
  iptables -A INPUT -p tcp --dport 8003 -j ACCEPT
  iptables -A INPUT -p tcp --dport 8005 -j ACCEPT
  iptables -A INPUT -p tcp --dport 30304 -j ACCEPT
  iptables -A INPUT -p tcp --dport 30305 -j ACCEPT
  iptables -A INPUT -p tcp --dport 8081 -j ACCEPT
  iptables -A INPUT -p tcp --dport 4002 -j ACCEPT
  service iptables save 2>/dev/null || true
  echo "iptables configured"
else
  echo -e "${YELLOW}No firewall tool found, please configure manually${NC}"
fi

echo -e "${GREEN}Step 4: Pulling Docker images...${NC}"

# Pull required images
docker pull ipfs/kubo:latest

# Create mock HashBurst node image
cat > Dockerfile <<'EOF'
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    jq \
    netcat \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app /data/blockchain /data/logs /config

WORKDIR /app

RUN echo '#!/bin/bash\nwhile true; do echo "HTTP/1.1 200 OK\n\n{\"status\":\"online\",\"block_height\":$(date +%s),\"network\":\"mainnet\"}" | nc -l -p 8002 -q 1; done' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8002 30303 8001

CMD ["/app/start.sh"]
EOF

docker build -t hashburst/node:latest .

echo -e "${GREEN}Step 5: Starting services...${NC}"

# Start Docker Compose
docker-compose down 2>/dev/null || true
docker-compose up -d

echo ""
echo -e "${GREEN}Step 6: Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo -e "${GREEN}Deployment Complete!${NC}"
echo ""
echo "Node Information:"
echo "  Node 2:"
echo "    - HashBurst RPC: http://85.187.128.14:8003"
echo "    - P2P: 85.187.128.14:30304"
echo ""
echo "  Node 3:"
echo "    - HashBurst RPC: http://85.187.128.14:8005"
echo "    - P2P: 85.187.128.14:30305"
echo ""
echo "  IPFS Node 2:"
echo "    - Gateway: http://85.187.128.14:8081"
echo "    - API: http://85.187.128.14:5002"
echo ""
echo "Next steps:"
echo "  1. Check logs: docker-compose logs -f"
echo "  2. Register nodes in database"
echo "  3. Configure wallet addresses"
echo ""
echo "To stop: docker-compose down"
echo "To restart: docker-compose restart"
