# Cloud Proxy Setup Guide - Build Your Own Aternos

This guide shows you how to create a professional Minecraft hosting setup using a cloud proxy server, similar to how Aternos works.

## 🎯 **How It Works**

```
Players → Cloud Server (Static IP) → Tunnel → Your Phone/PC
         (Reverse Proxy)                   (Minecraft Server)
```

**Benefits:**
- ✅ Static IP address (never changes)
- ✅ DDoS protection from cloud provider
- ✅ Better latency for players
- ✅ Professional setup
- ✅ You control everything

---

## 📋 **Prerequisites**

1. **Cloud Server** (Any of these):
   - Oracle Cloud (FREE forever tier - 24GB RAM!)
   - Google Cloud ($300 free credits)
   - AWS (12 months free)
   - DigitalOcean ($200 credits)
   - Vultr ($100 credits)

2. **Your Local Server**:
   - Minecraft server running on your phone/PC
   - RedStone CLI installed

---

## 🚀 **Method 1: HAProxy + Bore (Recommended)**

### **Step 1: Set Up Cloud Server**

**Oracle Cloud (FREE Forever - Detailed Setup):**

#### **1. Create Account:**
- Go to: https://cloud.oracle.com/free
- Click "Start for free"
- Fill in details (requires credit card for verification, but won't charge)
- Verify email

#### **2. Create VM Instance:**
After login, follow these steps:

1. Click **"Create a VM instance"**
2. **Name:** `minecraft-proxy` (or any name)
3. **Image:** 
   - Click "Change Image"
   - Select: **Ubuntu 22.04** (Minimal or Standard)
   - Click "Select Image"
4. **Shape:** 
   - Click "Change Shape"
   - Select: **VM.Standard.A1.Flex** (ARM-based, Always Free)
   - **OCPU:** 4 (max for free tier)
   - **Memory:** 24 GB (max for free tier)
   - Click "Select Shape"
5. **Networking:**
   - Use default VCN settings
   - Check: "Assign a public IPv4 address"
6. **SSH Keys:**
   - Download the private key (save as `oracle-key.pem`)
   - Or paste your own public key
7. Click **"Create"**

#### **3. Wait for Provisioning:**
- Status will show "Provisioning" → "Running" (1-2 minutes)
- Note your **Public IP address** (shown on instance details)

#### **4. Configure Firewall (IMPORTANT):**

In Oracle Cloud Console:
1. Go to instance details
2. Click "Virtual cloud network" name
3. Click "Security Lists" → "Default Security List"
4. Click "Add Ingress Rules"
5. Add rule:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `25565`
   - Click "Add Ingress Rules"

#### **5. Connect via SSH:**

**Windows:**
```powershell
# Set permissions on key file
icacls oracle-key.pem /inheritance:r
icacls oracle-key.pem /grant:r "%username%:R"

# Connect
ssh -i oracle-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Linux/Termux:**
```bash
chmod 400 oracle-key.pem
ssh -i oracle-key.pem ubuntu@YOUR_PUBLIC_IP
```

✅ You now have a free 4-core, 24GB RAM server!

### **Step 2: Install HAProxy on Cloud Server**

SSH into your cloud server:
```bash
ssh ubuntu@YOUR_CLOUD_IP
```

Install HAProxy:
```bash
sudo apt update
sudo apt install haproxy -y
```

### **Step 3: Configure HAProxy**

Edit HAProxy config:
```bash
sudo nano /etc/haproxy/haproxy.cfg
```

Add this configuration:
```haproxy
global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 4096

defaults
    log     global
    mode    tcp
    option  tcplog
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms

frontend minecraft_frontend
    bind *:25565
    default_backend minecraft_backend

backend minecraft_backend
    mode tcp
    balance roundrobin
    server minecraft1 bore.pub:YOUR_BORE_PORT check
```

### **Step 4: Start Bore on Your Phone/PC**

On your device running Minecraft:
```bash
# Install bore (if not already)
cargo install bore-cli

# Start bore tunnel
bore local 25565 --to bore.pub
# Copy the bore.pub:XXXXX address
```

### **Step 5: Update HAProxy Config**

Replace `YOUR_BORE_PORT` in HAProxy config with the port from bore:
```bash
sudo nano /etc/haproxy/haproxy.cfg
# Change: server minecraft1 bore.pub:54321 check
```

Restart HAProxy:
```bash
sudo systemctl restart haproxy
sudo systemctl enable haproxy
```

### **Step 6: Open Firewall**

Oracle Cloud:
```bash
# Add ingress rule for port 25565
sudo iptables -I INPUT -p tcp --dport 25565 -j ACCEPT
sudo netfilter-persistent save
```

### **Step 7: Connect!**

Players connect to: **YOUR_CLOUD_IP:25565**

---

## 🌐 **Method 2: Nginx Stream + LocalTunnel**

### **Step 1: Install Nginx**

```bash
sudo apt update
sudo apt install nginx-full -y
```

### **Step 2: Configure Nginx Stream**

Create config:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add to the main context (outside http block):
```nginx
stream {
    upstream minecraft {
        server 127.0.0.1:25566;
    }

    server {
        listen 25565;
        proxy_pass minecraft;
        proxy_connect_timeout 5s;
    }
}
```

### **Step 3: Set Up SSH Tunnel**

From your phone/PC to cloud server:
```bash
# Install autossh for persistent tunnel
pkg install autossh  # Termux
# or
sudo apt install autossh  # Linux

# Create reverse SSH tunnel
autossh -M 0 -R 25566:localhost:25565 -N ubuntu@YOUR_CLOUD_IP
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## ☁️ **Method 3: Cloudflare Spectrum (Paid)**

**Cost:** $5/month (Cloudflare Pro plan)

### **Setup:**

1. Add domain to Cloudflare
2. Enable Cloudflare Spectrum
3. Create TCP application:
   - External Port: 25565
   - Origin: Your bore tunnel or SSH tunnel

**Benefits:**
- DDoS protection
- Better latency (global network)
- Custom domain support

---

## 🔒 **Method 4: WireGuard VPN + HAProxy**

Most secure option - fully encrypted tunnel.

### **Step 1: Install WireGuard on Both Sides**

**Cloud Server:**
```bash
sudo apt install wireguard -y
wg genkey | tee privatekey | wg pubkey > publickey
```

**Your Device:**
```bash
pkg install wireguard-tools  # Termux
wg genkey | tee privatekey | wg pubkey > publickey
```

### **Step 2: Configure WireGuard**

**Cloud Server** `/etc/wireguard/wg0.conf`:
```ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = YOUR_CLOUD_PRIVATE_KEY

[Peer]
PublicKey = YOUR_PHONE_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
```

**Your Device** `wg0.conf`:
```ini
[Interface]
Address = 10.0.0.2/24
PrivateKey = YOUR_PHONE_PRIVATE_KEY

[Peer]
PublicKey = YOUR_CLOUD_PUBLIC_KEY
Endpoint = YOUR_CLOUD_IP:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
```

### **Step 3: Start WireGuard**

```bash
# Cloud server
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0

# Your device
wg-quick up wg0
```

### **Step 4: Configure HAProxy**

In HAProxy config, use WireGuard IP:
```haproxy
backend minecraft_backend
    mode tcp
    server minecraft1 10.0.0.2:25565 check
```

---

## 📊 **Comparison Table**

| Method | Cost | Security | Setup Time | Reliability |
|--------|------|----------|------------|-------------|
| HAProxy + Bore | Free | Medium | 15 min | Medium |
| Nginx + SSH | Free | High | 20 min | High |
| Cloudflare | $5/mo | Very High | 10 min | Very High |
| WireGuard + HAProxy | Free | Very High | 30 min | Very High |

---

## 🛠️ **Automation Scripts**

### **Script 1: Complete HAProxy + Bore Setup (One Command)**

Save this as `setup-proxy.sh` on your cloud server:

```bash
#!/bin/bash
# Minecraft Proxy Automation Script v1.0
# Supports: HAProxy + Bore, Nginx + SSH

set -e  # Exit on error

echo "╔════════════════════════════════════════╗"
echo "║   Minecraft Proxy Setup - RedStone CLI ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Menu selection
echo "Select proxy method:"
echo "  1) HAProxy + Bore (easiest)"
echo "  2) Nginx + SSH Tunnel"
echo "  3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo "📦 Installing HAProxy..."
    apt update -qq
    apt install haproxy iptables-persistent -y -qq
    
    echo ""
    echo "🔧 Configuration:"
    read -p "Enter your bore tunnel address (e.g., bore.pub:54321): " BORE_ADDRESS
    
    # Validate input
    if [[ ! $BORE_ADDRESS =~ ^bore\.pub:[0-9]+$ ]]; then
      echo "❌ Invalid format! Use: bore.pub:12345"
      exit 1
    fi
    
    echo ""
    echo "⚙️  Configuring HAProxy..."
    
    # Backup original config
    [ -f /etc/haproxy/haproxy.cfg ] && cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup
    
    # Create new config
    cat > /etc/haproxy/haproxy.cfg <<EOF
global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 4096
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    tcp
    option  tcplog
    option  dontlognull
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms
    retries 3

frontend minecraft_frontend
    bind *:25565
    mode tcp
    default_backend minecraft_backend

backend minecraft_backend
    mode tcp
    balance roundrobin
    option tcp-check
    server minecraft1 $BORE_ADDRESS check inter 5000 fall 3 rise 2
EOF
    
    echo "🔥 Configuring firewall..."
    iptables -I INPUT 1 -p tcp --dport 25565 -j ACCEPT
    iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT  # Keep SSH open
    netfilter-persistent save
    
    echo "🚀 Starting HAProxy..."
    systemctl restart haproxy
    systemctl enable haproxy
    
    # Get public IP
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "UNKNOWN")
    
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║          ✅ Setup Complete!            ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "📌 Server Address: $PUBLIC_IP:25565"
    echo "🔗 Bore Tunnel: $BORE_ADDRESS"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Keep bore running on your device: bore local 25565 --to bore.pub"
    echo "  2. Share $PUBLIC_IP:25565 with players"
    echo "  3. Monitor: sudo systemctl status haproxy"
    echo ""
    ;;
    
  2)
    echo ""
    echo "📦 Installing Nginx..."
    apt update -qq
    apt install nginx-full openssh-server iptables-persistent -y -qq
    
    echo "⚙️  Configuring Nginx Stream..."
    
    # Check if stream module exists
    if ! nginx -V 2>&1 | grep -q 'stream_module'; then
      echo "❌ Nginx stream module not available. Install nginx-full."
      exit 1
    fi
    
    # Backup nginx config
    [ -f /etc/nginx/nginx.conf ] && cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Add stream block
    cat >> /etc/nginx/nginx.conf <<'EOF'

# Minecraft TCP Proxy
stream {
    upstream minecraft_backend {
        server 127.0.0.1:25566;
    }

    server {
        listen 25565;
        proxy_pass minecraft_backend;
        proxy_connect_timeout 5s;
        proxy_timeout 1h;
    }
}
EOF
    
    echo "🔥 Configuring firewall..."
    iptables -I INPUT 1 -p tcp --dport 25565 -j ACCEPT
    iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT
    netfilter-persistent save
    
    echo "🚀 Starting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "UNKNOWN")
    
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║          ✅ Setup Complete!            ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "📌 Server Address: $PUBLIC_IP:25565"
    echo ""
    echo "📋 Next steps on your LOCAL device:"
    echo "  1. Install autossh:"
    echo "     pkg install autossh  # Termux"
    echo "     sudo apt install autossh  # Linux"
    echo ""
    echo "  2. Create SSH tunnel:"
    echo "     autossh -M 0 -R 25566:localhost:25565 -N ubuntu@$PUBLIC_IP"
    echo ""
    echo "  3. Share $PUBLIC_IP:25565 with players"
    echo ""
    ;;
    
  3)
    echo "Exiting..."
    exit 0
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo "📊 Useful commands:"
echo "  Check status: sudo systemctl status haproxy  # or nginx"
echo "  View logs:    sudo tail -f /var/log/haproxy.log"
echo "  Restart:      sudo systemctl restart haproxy"
echo "  Stop:         sudo systemctl stop haproxy"
echo ""
```

**Quick Install (One Command):**
```bash
# On your Oracle Cloud server:
wget -qO- https://raw.githubusercontent.com/GopikChenth/RedStoneNode-CLI/main/scripts/setup-proxy.sh | sudo bash
```

Or manual:
```bash
wget https://raw.githubusercontent.com/GopikChenth/RedStoneNode-CLI/main/scripts/setup-proxy.sh
chmod +x setup-proxy.sh
sudo ./setup-proxy.sh
```

---

### **Script 2: Bore Auto-Restart (For Your Phone/PC)**

Save this as `auto-bore.sh` on your device running Minecraft:

```bash
#!/bin/bash
# Auto-restart bore tunnel if it dies

MINECRAFT_PORT=25565
BORE_SERVER="bore.pub"
LOG_FILE="$HOME/bore-tunnel.log"

echo "🚀 Starting Bore Auto-Restart Service"
echo "📋 Log file: $LOG_FILE"
echo ""

# Function to start bore
start_bore() {
    echo "[$(date)] Starting bore tunnel..." | tee -a "$LOG_FILE"
    bore local $MINECRAFT_PORT --to $BORE_SERVER 2>&1 | tee -a "$LOG_FILE"
}

# Main loop
while true; do
    start_bore
    
    echo "[$(date)] ⚠️  Bore disconnected! Restarting in 5 seconds..." | tee -a "$LOG_FILE"
    sleep 5
done
```

**Run as background service:**
```bash
# Make executable
chmod +x auto-bore.sh

# Run in background
nohup ./auto-bore.sh &

# Or use screen/tmux
screen -S bore
./auto-bore.sh
# Ctrl+A, then D to detach
```

---

### **Script 3: Health Check Monitor**

Save as `monitor-proxy.sh` on cloud server:

```bash
#!/bin/bash
# Monitor proxy health and send alerts

MINECRAFT_PORT=25565
CHECK_INTERVAL=60  # seconds
LOG_FILE="/var/log/minecraft-proxy-health.log"

check_haproxy() {
    if systemctl is-active --quiet haproxy; then
        echo "[$(date)] ✅ HAProxy is running" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date)] ❌ HAProxy is DOWN! Restarting..." >> "$LOG_FILE"
        systemctl restart haproxy
        return 1
    fi
}

check_port() {
    if netstat -tuln | grep -q ":$MINECRAFT_PORT "; then
        echo "[$(date)] ✅ Port $MINECRAFT_PORT is open" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date)] ❌ Port $MINECRAFT_PORT is closed!" >> "$LOG_FILE"
        return 1
    fi
}

while true; do
    check_haproxy
    check_port
    sleep $CHECK_INTERVAL
done
```

**Run as systemd service:**
```bash
# Create service file
sudo nano /etc/systemd/system/proxy-monitor.service
```

```ini
[Unit]
Description=Minecraft Proxy Health Monitor
After=network.target haproxy.service

[Service]
Type=simple
User=root
ExecStart=/root/monitor-proxy.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable proxy-monitor
sudo systemctl start proxy-monitor
```

---

## 🔧 **Troubleshooting**

### **Players can't connect**
```bash
# Check HAProxy status
sudo systemctl status haproxy

# Check if port is open
sudo netstat -tulpn | grep 25565

# Test connectivity
telnet YOUR_CLOUD_IP 25565
```

### **High latency**
- Use WireGuard method (fastest)
- Choose cloud region closer to players
- Enable TCP BBR on cloud server:
```bash
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### **Bore tunnel drops**
```bash
# Use autobore (auto-restart)
while true; do
    bore local 25565 --to bore.pub
    echo "Bore disconnected, restarting in 5s..."
    sleep 5
done
```

---

## 💡 **Pro Tips**

1. **Use systemd service** for auto-restart:
```bash
sudo nano /etc/systemd/system/minecraft-proxy.service
```

```ini
[Unit]
Description=Minecraft Proxy
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStart=/usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg

[Install]
WantedBy=multi-user.target
```

2. **Monitor with logs**:
```bash
sudo tail -f /var/log/haproxy.log
```

3. **Add multiple backends** (load balancing):
```haproxy
backend minecraft_backend
    mode tcp
    balance leastconn
    server mc1 bore.pub:54321 check
    server mc2 bore.pub:54322 check backup
```

---

## 🎮 **Next Steps**

After setting up your proxy:
1. Keep your RedStone CLI server running
2. Share your cloud IP with friends
3. Monitor server performance
4. Consider adding a custom domain

**Need help?** Open an issue: https://github.com/GopikChenth/RedStoneNode-CLI/issues
