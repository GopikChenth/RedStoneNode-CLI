#!/bin/bash
# Railway Minecraft Proxy Deployment Script
# Usage: ./deploy-railway.sh

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Railway Minecraft Proxy Deployer    ║"
echo "║         RedStone CLI v1.4.0            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo ""
    echo -e "${CYAN}📦 Install Railway CLI:${NC}"
    echo "   npm install -g @railway/cli"
    echo ""
    echo "   Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI detected${NC}"
echo ""

# Check if already in Railway project directory
if [ ! -f "Dockerfile" ] || [ ! -f "haproxy.cfg" ]; then
    echo -e "${YELLOW}⚠️  Railway project files not found${NC}"
    echo ""
    read -p "Create new Railway project directory? (y/n): " CREATE_DIR
    
    if [[ $CREATE_DIR =~ ^[Yy]$ ]]; then
        read -p "Enter project directory name [minecraft-railway-proxy]: " PROJECT_NAME
        PROJECT_NAME=${PROJECT_NAME:-minecraft-railway-proxy}
        
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
        
        echo -e "${CYAN}📁 Creating project files...${NC}"
        
        # Create Dockerfile
        cat > Dockerfile <<'EOF'
FROM haproxy:2.8-alpine

RUN apk add --no-cache netcat-openbsd

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 25565

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 25565 || exit 1

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
EOF
        
        # Create HAProxy config
        cat > haproxy.cfg <<'EOF'
global
    log stdout format raw local0
    maxconn 2048
    tune.bufsize 16384

defaults
    log     global
    mode    tcp
    option  tcplog
    option  dontlognull
    timeout connect 5000ms
    timeout client  300000ms
    timeout server  300000ms
    retries 3

frontend minecraft_frontend
    bind *:25565
    mode tcp
    default_backend minecraft_backend

backend minecraft_backend
    mode tcp
    balance roundrobin
    option tcp-check
    server-template minecraft 1 ${BORE_ADDRESS} check inter 10s fall 3 rise 2
EOF
        
        # Create railway.json
        cat > railway.json <<'EOF'
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
        
        # Create .gitignore
        cat > .gitignore <<'EOF'
node_modules/
.env
*.log
.DS_Store
EOF
        
        # Create README
        cat > README.md <<'EOF'
# Minecraft Railway Proxy

HAProxy TCP proxy for Minecraft servers on Railway.

## Setup:
1. Set `BORE_ADDRESS` environment variable (e.g., bore.pub:54321)
2. Deploy to Railway
3. Players connect to: your-app.railway.app:25565

## Environment Variables:
- `BORE_ADDRESS`: Your bore tunnel address (required)

## Maintained by: RedStone CLI
EOF
        
        echo -e "${GREEN}✅ Project files created${NC}"
        echo ""
    else
        echo -e "${RED}❌ Cancelled${NC}"
        exit 0
    fi
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${CYAN}📦 Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial Railway proxy setup"
    echo -e "${GREEN}✅ Git initialized${NC}"
    echo ""
fi

# Login to Railway
echo -e "${CYAN}🔐 Logging into Railway...${NC}"
echo "   (Browser window will open)"
echo ""
railway login

echo ""
echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Initialize Railway project
echo -e "${CYAN}📁 Creating Railway project...${NC}"
railway init

echo ""
echo -e "${GREEN}✅ Railway project created${NC}"
echo ""

# Get bore address
echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Bore Tunnel Configuration           ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Before continuing, start your bore tunnel:"
echo -e "${CYAN}  bore local 25565 --to bore.pub${NC}"
echo ""
echo "You should see output like:"
echo "  listening at bore.pub:54321"
echo ""

read -p "Enter your bore tunnel address (e.g., bore.pub:54321): " BORE_ADDRESS

# Validate bore address
if [[ ! $BORE_ADDRESS =~ ^bore\.pub:[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid format!${NC}"
    echo "   Expected: bore.pub:12345"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Bore address validated: $BORE_ADDRESS${NC}"
echo ""

# Set environment variables
echo -e "${CYAN}⚙️  Setting environment variables...${NC}"
railway variables set BORE_ADDRESS="$BORE_ADDRESS"

echo -e "${GREEN}✅ Environment variables set${NC}"
echo ""

# Deploy
echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Deploying to Railway...             ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo "This may take 2-3 minutes..."
echo ""

railway up --detach

echo ""
echo -e "${GREEN}✅ Deployment initiated${NC}"
echo ""

# Wait for deployment
echo -e "${CYAN}⏳ Waiting for deployment to complete...${NC}"
sleep 10

# Generate domain
echo -e "${CYAN}🌐 Generating public domain...${NC}"
railway domain

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 Setup Complete!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo ""
echo "1. ${GREEN}Keep bore tunnel running:${NC}"
echo "   bore local 25565 --to bore.pub"
echo ""
echo "2. ${GREEN}Get your Railway URL:${NC}"
echo "   railway status"
echo "   Or check: https://railway.app/dashboard"
echo ""
echo "3. ${GREEN}Share with players:${NC}"
echo "   your-app.railway.app:25565"
echo ""
echo "4. ${GREEN}Monitor your service:${NC}"
echo "   railway logs"
echo "   railway status"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  • Keep bore tunnel active"
echo "  • Railway free tier: \$5 credit (~500 hours)"
echo "  • Service may sleep after inactivity"
echo "  • Set up Uptime Robot to keep alive"
echo ""
echo -e "${CYAN}🔗 Useful Commands:${NC}"
echo "  railway logs        # View logs"
echo "  railway status      # Check status"
echo "  railway open        # Open dashboard"
echo "  railway variables   # List variables"
echo ""
echo -e "${GREEN}✨ Happy gaming!${NC}"
