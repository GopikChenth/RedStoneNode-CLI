# Railway Deployment Guide - Free Minecraft Hosting

Deploy your Minecraft server to Railway's cloud platform with persistent storage and zero configuration.

## 🎯 **What is Railway?**

Railway is a modern cloud platform that lets you deploy applications with minimal setup. Perfect for:
- ✅ **Free $5/month credit** (500 hours of usage)
- ✅ **No credit card required** initially
- ✅ **Automatic HTTPS** (but we need TCP for Minecraft)
- ✅ **Git-based deployments**
- ✅ **Persistent storage** (volumes)
- ✅ **Easy environment variables**

---

## ⚠️ **Important Limitations**

Railway has some constraints for Minecraft servers:

| Feature | Railway Support | Workaround |
|---------|----------------|------------|
| **TCP/UDP Direct** | ❌ HTTP/HTTPS only | Use **bore** tunnel |
| **Static IP** | ❌ Changes on redeploy | Use custom domain |
| **Custom Ports** | ✅ Via $PORT variable | Map internally |
| **Persistent Storage** | ✅ Volumes | Mount to /data |
| **Memory Limit** | ✅ 8GB max (free: 512MB) | Optimize Java flags |
| **Always-On** | ⚠️ Sleeps after inactivity | Use cron job to ping |

**Best Use Case:** Railway as a **proxy server** (HAProxy) + your phone/PC runs Minecraft

---

## 🚀 **Method 1: Railway as Proxy (Recommended)**

This setup is similar to the cloud proxy guide, but uses Railway's free tier.

### **Architecture:**
```
Players → Railway (HAProxy Proxy) → Bore Tunnel → Your Phone/PC
          railway.app domain                      Minecraft Server
```

### **Step 1: Create Railway Project**

1. Go to: https://railway.app
2. Sign up with GitHub (no credit card needed)
3. Click **"New Project"**
4. Select **"Empty Project"**
5. Name it: `minecraft-proxy`

### **Step 2: Create Project Files**

Create a new folder on your PC:
```powershell
mkdir railway-minecraft-proxy
cd railway-minecraft-proxy
```

Create these files:

**`Dockerfile`:**
```dockerfile
FROM haproxy:2.8-alpine

# Copy HAProxy config
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

# Expose Minecraft port
EXPOSE 25565

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 25565 || exit 1

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
```

**`haproxy.cfg`:**
```haproxy
global
    log stdout format raw local0
    maxconn 2048
    # Reduced for Railway's free tier
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
    bind *:${PORT}
    mode tcp
    default_backend minecraft_backend

backend minecraft_backend
    mode tcp
    balance roundrobin
    option tcp-check
    # Will be updated via environment variable
    server minecraft1 ${BORE_ADDRESS} check inter 10s fall 3 rise 2
```

**`railway.json`:**
```json
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
```

**`.gitignore`:**
```
node_modules/
.env
*.log
```

**`README.md`:**
```markdown
# Minecraft Proxy on Railway

This project deploys HAProxy as a TCP proxy for Minecraft servers.

## Setup:
1. Set BORE_ADDRESS environment variable (e.g., bore.pub:54321)
2. Deploy to Railway
3. Players connect to: your-app.railway.app:PORT
```

### **Step 3: Initialize Git and Deploy**

```powershell
git init
git add .
git commit -m "Initial Railway proxy setup"
```

### **Step 4: Deploy to Railway**

1. In Railway dashboard, click your project
2. Click **"New Service"** → **"GitHub Repo"**
3. Connect your GitHub account
4. Select your repository
5. Railway will auto-detect Dockerfile and deploy

### **Step 5: Configure Environment Variables**

In Railway dashboard:
1. Click your service
2. Go to **"Variables"** tab
3. Add these variables:
   - `PORT` = `25565` (Railway assigns this automatically, but we force it)
   - `BORE_ADDRESS` = `bore.pub:54321` (your bore tunnel)

### **Step 6: Expose Public Network**

1. Go to **"Settings"** tab
2. Click **"Networking"**
3. Click **"Generate Domain"**
4. Note your domain: `your-app.railway.app`

### **Step 7: Start Bore on Your Device**

```bash
# On your phone/PC
bore local 25565 --to bore.pub
```

Copy the bore address (e.g., `bore.pub:54321`) and update Railway's `BORE_ADDRESS` variable.

### **Step 8: Connect!**

Players connect to: **`your-app.railway.app:25565`**

---

## 🐳 **Method 2: Railway Runs Minecraft (Limited)**

⚠️ **Not recommended for production** - Railway's free tier has limited resources and no native TCP support.

But if you want to try:

### **Step 1: Create Minecraft Project**

**`Dockerfile`:**
```dockerfile
FROM openjdk:17-slim

WORKDIR /minecraft

# Install wget
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Download Minecraft server
RUN wget https://piston-data.mojang.com/v1/objects/145ff0858209bcfc164859ba735d4199aafa1eea/server.jar -O server.jar

# Accept EULA
RUN echo "eula=true" > eula.txt

# Create basic server.properties
RUN echo "server-port=${PORT:-25565}" > server.properties && \
    echo "online-mode=false" >> server.properties && \
    echo "difficulty=easy" >> server.properties && \
    echo "max-players=10" >> server.properties && \
    echo "view-distance=6" >> server.properties && \
    echo "motd=Railway Minecraft Server" >> server.properties

# Expose port
EXPOSE ${PORT:-25565}

# Start server with optimized flags for low memory
CMD java -Xms256M -Xmx512M -XX:+UseG1GC -XX:+ParallelRefProcEnabled \
    -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions \
    -XX:+DisableExplicitGC -XX:+AlwaysPreTouch \
    -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 \
    -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 \
    -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 \
    -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 \
    -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 \
    -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 \
    -Dusing.aikars.flags=https://mcflags.emc.gs \
    -Daikars.new.flags=true \
    -jar server.jar nogui
```

**Problem:** Railway doesn't expose raw TCP, only HTTP/HTTPS. You'll need a bore tunnel anyway:

```dockerfile
# Modified CMD to use bore
CMD bore local ${PORT:-25565} --to bore.pub & \
    java -Xms256M -Xmx512M -jar server.jar nogui
```

---

## 🔧 **Automation Script: Railway CLI Deployment**

Install Railway CLI:
```powershell
# Windows (PowerShell)
irm https://railway.app/install.ps1 | iex

# Or via npm
npm install -g @railway/cli
```

**`deploy-to-railway.sh`** (for Git Bash/Linux/Termux):
```bash
#!/bin/bash
# One-click Railway deployment

set -e

echo "🚂 Railway Minecraft Proxy Deployer"
echo "===================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "📦 Install: npm install -g @railway/cli"
    exit 1
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create project
echo "📁 Creating Railway project..."
railway init

# Link project
echo "🔗 Linking to Railway..."
railway link

# Get bore address
echo ""
read -p "Enter your bore tunnel address (e.g., bore.pub:54321): " BORE_ADDRESS

# Validate
if [[ ! $BORE_ADDRESS =~ ^bore\.pub:[0-9]+$ ]]; then
    echo "❌ Invalid format! Use: bore.pub:12345"
    exit 1
fi

# Set environment variables
echo "⚙️  Setting environment variables..."
railway variables set BORE_ADDRESS="$BORE_ADDRESS"
railway variables set PORT="25565"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
railway status

echo ""
echo "📋 Next steps:"
echo "  1. Keep bore running: bore local 25565 --to bore.pub"
echo "  2. Get your Railway domain: railway domain"
echo "  3. Share with players: YOUR-APP.railway.app:25565"
```

**Usage:**
```bash
chmod +x deploy-to-railway.sh
./deploy-to-railway.sh
```

---

## 📊 **Railway Free Tier Limits**

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| **Credit** | $5/month | ~500 hours of 512MB service |
| **Memory** | 512MB default | Can request up to 8GB (paid) |
| **CPU** | Shared | Fair usage policy |
| **Storage** | 1GB ephemeral | Use volumes for persistence |
| **Bandwidth** | 100GB/month | Sufficient for small servers |
| **Builds** | Unlimited | Fast Docker builds |

**Cost Estimate:**
- Proxy service (HAProxy): ~$0.01/hour = $7.20/month
- With $5 credit: **Free for ~500 hours** (~20 days)

---

## 🛡️ **Keep Your Service Alive**

Railway may sleep inactive services. Prevent this:

**Method 1: Uptime Robot (Free External Monitoring)**
1. Sign up: https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.railway.app`
   - Interval: 5 minutes
3. Uptime Robot will ping your service every 5 minutes

**Method 2: GitHub Actions Cron Job**

Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Railway Alive

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Railway service
        run: |
          curl -I https://your-app.railway.app || true
```

**Method 3: Railway Cron Service**

Add to your project:

**`cron.dockerfile`:**
```dockerfile
FROM alpine:latest

RUN apk add --no-cache curl

CMD while true; do \
  curl -I https://your-app.railway.app; \
  sleep 300; \
done
```

---

## 🔍 **Monitoring & Logs**

### **View Logs:**
```bash
railway logs
```

### **Check Service Health:**
```bash
railway status
```

### **View Metrics:**
1. Open Railway dashboard
2. Click your service
3. Go to **"Metrics"** tab
4. Monitor: CPU, Memory, Network

---

## 🐛 **Troubleshooting**

### **1. "Service crashed" error**

**Check logs:**
```bash
railway logs
```

**Common causes:**
- HAProxy config syntax error
- BORE_ADDRESS not set
- Port binding issue

**Fix:**
```bash
# Validate HAProxy config locally
haproxy -c -f haproxy.cfg

# Restart service
railway restart
```

### **2. "Cannot connect" from players**

**Test connection:**
```powershell
# From your PC
Test-NetConnection your-app.railway.app -Port 25565
```

**Check bore tunnel:**
```bash
# On your device
curl http://bore.pub:54321  # Your bore port
```

### **3. High latency**

Railway uses shared resources. Optimize:
- Reduce HAProxy `maxconn`
- Lower `timeout` values
- Use closer Railway region

### **4. Service keeps sleeping**

Set up Uptime Robot or GitHub Actions cron (see "Keep Your Service Alive" section)

---

## 💡 **Pro Tips**

1. **Custom Domain:**
   - Add your domain in Railway settings
   - Point CNAME to `your-app.railway.app`

2. **Multiple Servers:**
   - Add multiple backends in HAProxy:
   ```haproxy
   backend minecraft_backend
       server mc1 bore.pub:54321 check
       server mc2 bore.pub:54322 check backup
   ```

3. **Environment-based Config:**
   Use Railway's environment variables:
   ```bash
   railway variables set BORE_ADDRESS="bore.pub:54321"
   railway variables set MAX_PLAYERS="20"
   ```

4. **Persistent Volumes:**
   If running Minecraft directly:
   ```bash
   railway volume create minecraft-data
   railway volume mount minecraft-data /minecraft/world
   ```

5. **Upgrade to Pro:**
   - $5/month (after free credit runs out)
   - More resources
   - Priority support

---

## 📈 **Scaling Up**

When you outgrow free tier:

| Players | RAM Needed | Railway Cost | Alternative |
|---------|------------|--------------|-------------|
| 1-5 | 512MB | Free ($5 credit) | Stay on Railway |
| 5-10 | 1GB | ~$10/month | Upgrade Railway |
| 10-20 | 2GB | ~$20/month | Consider Oracle Cloud |
| 20+ | 4GB+ | ~$40/month | Dedicated VPS (Hetzner $5) |

**Recommendation:** Use Railway for **proxy only** (cheap), run Minecraft on your device (free).

---

## 🎯 **Complete Setup Checklist**

- [ ] Sign up for Railway (no credit card)
- [ ] Create proxy project with Dockerfile
- [ ] Push to GitHub
- [ ] Deploy to Railway
- [ ] Set `BORE_ADDRESS` environment variable
- [ ] Generate Railway domain
- [ ] Start bore tunnel on your device
- [ ] Test connection with players
- [ ] Set up Uptime Robot for keep-alive
- [ ] Monitor logs and metrics

---

## 🆚 **Railway vs Other Options**

| Feature | Railway | Oracle Cloud | Playit.gg |
|---------|---------|--------------|-----------|
| **Cost** | $5 free → $5/mo | FREE forever | FREE |
| **Setup Time** | 15 min | 30 min | 2 min |
| **Reliability** | High | Very High | Medium |
| **Custom Domain** | ✅ Yes | ✅ Yes | ❌ No |
| **Static IP** | ❌ No | ✅ Yes | ❌ No |
| **TCP Support** | ⚠️ Via proxy | ✅ Native | ✅ Native |
| **Best For** | Proxy server | Full hosting | Quick testing |

---

## 🔗 **Useful Links**

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/develop/cli
- Railway Templates: https://railway.app/templates
- Uptime Robot: https://uptimerobot.com

---

## 📞 **Get Help**

- Railway Discord: https://discord.gg/railway
- RedStone CLI Issues: https://github.com/GopikChenth/RedStoneNode-CLI/issues
- Railway Status: https://status.railway.app

---

## 🎮 **Quick Start (TL;DR)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Clone template
git clone https://github.com/GopikChenth/railway-minecraft-proxy
cd railway-minecraft-proxy

# 3. Deploy
railway login
railway init
railway up

# 4. Set bore address
railway variables set BORE_ADDRESS="bore.pub:YOUR_PORT"

# 5. Start bore on your device
bore local 25565 --to bore.pub

# 6. Get domain and share
railway domain
```

**Done!** Players connect to: `your-app.railway.app:25565`

---

**Need more help?** Check out our other guides:
- [Cloud Proxy Guide](CLOUD-PROXY-GUIDE.md) - Oracle Cloud setup
- [Bore Setup Guide](BORE-SETUP-GUIDE.md) - Bore installation
- [Quick Start](QUICKSTART.md) - RedStone CLI basics
