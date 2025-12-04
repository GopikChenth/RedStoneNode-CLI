# Minecraft Railway Proxy

HAProxy TCP proxy for Minecraft servers deployed on Railway.

## 🚀 Quick Deploy

### Windows (PowerShell):
```powershell
.\deploy-railway.ps1
```

### Linux/Mac/Termux:
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

## 📋 What's Included

- **Dockerfile** - HAProxy 2.8 Alpine with health checks
- **haproxy.cfg** - Optimized TCP proxy configuration
- **railway.json** - Railway deployment settings
- **deploy-railway.sh** - Linux/Mac deployment script
- **deploy-railway.ps1** - Windows PowerShell deployment script
- **keep-alive.yml** - GitHub Actions workflow to prevent sleeping

## 🛠️ Manual Setup

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Set environment variables:**
   ```bash
   railway variables set BORE_ADDRESS="bore.pub:YOUR_PORT"
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Generate domain:**
   ```bash
   railway domain
   ```

## 🔧 Configuration

### Environment Variables

Set these in Railway dashboard or via CLI:

- **BORE_ADDRESS** (Required): Your bore tunnel address (e.g., `bore.pub:54321`)

### HAProxy Settings

Edit `haproxy.cfg` to customize:

- `maxconn`: Maximum concurrent connections (default: 2048)
- `timeout`: Connection timeouts (default: 5min)
- Health check interval: 10 seconds

## 📊 Monitoring

### View logs:
```bash
railway logs
```

### Check status:
```bash
railway status
```

### Open dashboard:
```bash
railway open
```

## 🔄 Keep Service Alive

Railway may sleep inactive services. Use one of these methods:

### 1. Uptime Robot (Recommended)
- Sign up: https://uptimerobot.com
- Add HTTP(s) monitor
- Set interval: 5 minutes

### 2. GitHub Actions
- Copy `keep-alive.yml` to `.github/workflows/`
- Add `RAILWAY_URL` secret to your repo
- Workflow runs every 5 minutes

## 💰 Railway Free Tier

- **Credit**: $5/month (~500 hours)
- **Memory**: 512MB default
- **CPU**: Shared
- **Bandwidth**: 100GB/month

**Cost estimate**: ~$0.01/hour = ~$7.20/month (covered by $5 credit for ~20 days)

## 🐛 Troubleshooting

### "Service crashed"
```bash
# Check logs
railway logs

# Validate HAProxy config locally
docker run --rm -v $(pwd)/haproxy.cfg:/test.cfg haproxy:2.8-alpine haproxy -c -f /test.cfg
```

### "Cannot connect"
```bash
# Test from your PC
Test-NetConnection your-app.railway.app -Port 25565

# Check bore tunnel
curl http://bore.pub:YOUR_PORT
```

### "High latency"
- Reduce `maxconn` in haproxy.cfg
- Lower timeout values
- Use WireGuard VPN instead of bore

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/develop/cli
- HAProxy Docs: http://www.haproxy.org/

## 📞 Support

- Railway Discord: https://discord.gg/railway
- RedStone CLI Issues: https://github.com/GopikChenth/RedStoneNode-CLI/issues

## 📄 License

MIT License - See main repository for details

---

**Maintained by**: [RedStone CLI](https://github.com/GopikChenth/RedStoneNode-CLI)
