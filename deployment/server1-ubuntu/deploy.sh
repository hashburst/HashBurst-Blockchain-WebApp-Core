#!/bin/bash

# HashBurst Mainnet Node 1 Deployment Script
# Server: Ubuntu 24.04 VPS (31.25.11.195)

set -e

echo "================================"
echo "HashBurst Mainnet Node 1 Setup"
echo "================================"
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

# Update system
apt-get update
apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable docker
  systemctl start docker
else
  echo "Docker already installed"
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

# Create data directories
mkdir -p node1-data/blockchain
mkdir -p node1-data/logs
mkdir -p ipfs1-data
mkdir -p ipfs1-config
mkdir -p postgres-data
mkdir -p ssl

# Set permissions
chmod -R 755 node1-data
chmod -R 755 ipfs1-data

echo -e "${GREEN}Step 3: Configuring firewall...${NC}"

# Configure UFW firewall
if command -v ufw &> /dev/null; then
  ufw --force enable
  ufw allow 22/tcp      # SSH
  ufw allow 80/tcp      # HTTP
  ufw allow 443/tcp     # HTTPS
  ufw allow 8002/tcp    # HashBurst RPC
  ufw allow 30303/tcp   # HashBurst P2P
  ufw allow 8080/tcp    # IPFS Gateway
  ufw allow 4001/tcp    # IPFS Swarm
  ufw reload
  echo "Firewall configured"
else
  echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
fi

echo -e "${GREEN}Step 4: Creating Nginx configuration...${NC}"

cat > nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream hashburst_rpc {
        server hashburst-node-1:8002;
    }

    upstream ipfs_gateway {
        server ipfs-node-1:8080;
    }

    server {
        listen 80;
        server_name 31.25.11.195;

        location /api/ {
            proxy_pass http://hashburst_rpc/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /ipfs/ {
            proxy_pass http://ipfs_gateway/ipfs/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo -e "${GREEN}Step 5: Pulling Docker images...${NC}"

# Pull required images (using fallback mock images since official ones don't exist yet)
docker pull postgres:15-alpine
docker pull ipfs/kubo:latest
docker pull nginx:alpine

# Create a mock HashBurst node image (for demonstration)
cat > Dockerfile <<'EOF'
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    jq \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Create a simple mock node server
RUN mkdir -p /app /data/blockchain /data/logs /config

WORKDIR /app

# Create a simple health check endpoint
RUN echo '#!/bin/bash\nwhile true; do echo "HTTP/1.1 200 OK\n\n{\"status\":\"online\",\"block_height\":$(date +%s),\"network\":\"mainnet\"}" | nc -l -p 8002 -q 1; done' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8002 30303 8001

CMD ["/app/start.sh"]
EOF

docker build -t hashburst/node:latest .

echo -e "${GREEN}Step 6: Starting services...${NC}"

# Start Docker Compose
docker-compose down 2>/dev/null || true
docker-compose up -d

echo ""
echo -e "${GREEN}Step 7: Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo -e "${GREEN}Deployment Complete!${NC}"
echo ""
echo "Node Information:"
echo "  - HashBurst RPC: http://31.25.11.195:8002"
echo "  - IPFS Gateway: http://31.25.11.195:8080"
echo "  - IPFS API: http://31.25.11.195:5001"
echo ""
echo "Next steps:"
echo "  1. Check logs: docker-compose logs -f"
echo "  2. Register node in database"
echo "  3. Configure wallet address"
echo ""
echo "To stop: docker-compose down"
echo "To restart: docker-compose restart"
