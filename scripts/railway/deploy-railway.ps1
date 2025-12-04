# PowerShell script for Railway deployment on Windows
# Usage: .\deploy-railway.ps1

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Railway Minecraft Proxy Deployer    ║" -ForegroundColor Cyan
Write-Host "║         RedStone CLI v1.4.0            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Install Railway CLI:" -ForegroundColor Cyan
    Write-Host "   npm install -g @railway/cli" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or visit: https://docs.railway.app/develop/cli" -ForegroundColor White
    exit 1
}

Write-Host "✅ Railway CLI detected" -ForegroundColor Green
Write-Host ""

# Check if already in Railway project directory
if (!(Test-Path "Dockerfile") -or !(Test-Path "haproxy.cfg")) {
    Write-Host "⚠️  Railway project files not found" -ForegroundColor Yellow
    Write-Host ""
    $createDir = Read-Host "Create new Railway project directory? (y/n)"
    
    if ($createDir -match "^[Yy]$") {
        $projectName = Read-Host "Enter project directory name [minecraft-railway-proxy]"
        if ([string]::IsNullOrWhiteSpace($projectName)) {
            $projectName = "minecraft-railway-proxy"
        }
        
        New-Item -ItemType Directory -Path $projectName -Force | Out-Null
        Set-Location $projectName
        
        Write-Host "📁 Creating project files..." -ForegroundColor Cyan
        
        # Create Dockerfile
        @"
FROM haproxy:2.8-alpine

RUN apk add --no-cache netcat-openbsd

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 25565

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 25565 || exit 1

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8 -NoNewline
        
        # Create HAProxy config
        @"
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
    server-template minecraft 1 `${BORE_ADDRESS} check inter 10s fall 3 rise 2
"@ | Out-File -FilePath "haproxy.cfg" -Encoding UTF8 -NoNewline
        
        # Create railway.json
        @"
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
"@ | Out-File -FilePath "railway.json" -Encoding UTF8
        
        # Create .gitignore
        @"
node_modules/
.env
*.log
.DS_Store
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
        
        # Create README
        @"
# Minecraft Railway Proxy

HAProxy TCP proxy for Minecraft servers on Railway.

## Setup:
1. Set ``BORE_ADDRESS`` environment variable (e.g., bore.pub:54321)
2. Deploy to Railway
3. Players connect to: your-app.railway.app:25565

## Environment Variables:
- ``BORE_ADDRESS``: Your bore tunnel address (required)

## Maintained by: RedStone CLI
"@ | Out-File -FilePath "README.md" -Encoding UTF8
        
        Write-Host "✅ Project files created" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }
}

# Initialize git if needed
if (!(Test-Path ".git")) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Cyan
    git init
    git add .
    git commit -m "Initial Railway proxy setup"
    Write-Host "✅ Git initialized" -ForegroundColor Green
    Write-Host ""
}

# Login to Railway
Write-Host "🔐 Logging into Railway..." -ForegroundColor Cyan
Write-Host "   (Browser window will open)" -ForegroundColor White
Write-Host ""
railway login

Write-Host ""
Write-Host "✅ Logged in" -ForegroundColor Green
Write-Host ""

# Initialize Railway project
Write-Host "📁 Creating Railway project..." -ForegroundColor Cyan
railway init

Write-Host ""
Write-Host "✅ Railway project created" -ForegroundColor Green
Write-Host ""

# Get bore address
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Bore Tunnel Configuration           ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before continuing, start your bore tunnel:" -ForegroundColor White
Write-Host "  bore local 25565 --to bore.pub" -ForegroundColor Cyan
Write-Host ""
Write-Host "You should see output like:" -ForegroundColor White
Write-Host "  listening at bore.pub:54321" -ForegroundColor Gray
Write-Host ""

$boreAddress = Read-Host "Enter your bore tunnel address (e.g., bore.pub:54321)"

# Validate bore address
if ($boreAddress -notmatch "^bore\.pub:\d+$") {
    Write-Host "❌ Invalid format!" -ForegroundColor Red
    Write-Host "   Expected: bore.pub:12345" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✅ Bore address validated: $boreAddress" -ForegroundColor Green
Write-Host ""

# Set environment variables
Write-Host "⚙️  Setting environment variables..." -ForegroundColor Cyan
railway variables set "BORE_ADDRESS=$boreAddress"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Deploying to Railway...             ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "This may take 2-3 minutes..." -ForegroundColor White
Write-Host ""

railway up --detach

Write-Host ""
Write-Host "✅ Deployment initiated" -ForegroundColor Green
Write-Host ""

# Wait for deployment
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Generate domain
Write-Host "🌐 Generating public domain..." -ForegroundColor Cyan
railway domain

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          🎉 Setup Complete!            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. " -NoNewline; Write-Host "Keep bore tunnel running:" -ForegroundColor Green
Write-Host "   bore local 25565 --to bore.pub" -ForegroundColor White
Write-Host ""
Write-Host "2. " -NoNewline; Write-Host "Get your Railway URL:" -ForegroundColor Green
Write-Host "   railway status" -ForegroundColor White
Write-Host "   Or check: https://railway.app/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "3. " -NoNewline; Write-Host "Share with players:" -ForegroundColor Green
Write-Host "   your-app.railway.app:25565" -ForegroundColor White
Write-Host ""
Write-Host "4. " -NoNewline; Write-Host "Monitor your service:" -ForegroundColor Green
Write-Host "   railway logs" -ForegroundColor White
Write-Host "   railway status" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important:" -ForegroundColor Yellow
Write-Host "  • Keep bore tunnel active" -ForegroundColor White
Write-Host "  • Railway free tier: `$5 credit (~500 hours)" -ForegroundColor White
Write-Host "  • Service may sleep after inactivity" -ForegroundColor White
Write-Host "  • Set up Uptime Robot to keep alive" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Cyan
Write-Host "  railway logs        # View logs" -ForegroundColor White
Write-Host "  railway status      # Check status" -ForegroundColor White
Write-Host "  railway open        # Open dashboard" -ForegroundColor White
Write-Host "  railway variables   # List variables" -ForegroundColor White
Write-Host ""
Write-Host "✨ Happy gaming!" -ForegroundColor Green
