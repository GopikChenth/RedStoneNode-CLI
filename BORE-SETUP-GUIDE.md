# Bore Installation Guide - Windows & Android

## 🪟 WINDOWS

### Problem: Bore requires compilation, which needs Visual Studio Build Tools (5GB+)

### ✅ RECOMMENDED ALTERNATIVES (No compilation needed):

#### Option 1: Playit.gg (Already Working!)
```bash
# This is already configured in your CLI
redstonenode
# Select server → Start → Choose "Yes" for tunnel
# ✅ Auto-downloads, auto-starts, shows URL
```

#### Option 2: Cloudflared (70MB download)
```bash
# Download manually:
# https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
# Save to: C:\Users\gopik\AppData\Roaming\.redstone\cloudflared\cloudflared.exe

# Or let CLI auto-download when you select it
```

### If you REALLY want Bore:

#### Step 1: Install Visual Studio Build Tools
1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Run installer
3. Select: **"Desktop development with C++"**
4. Wait 10-15 minutes for 5GB download + install
5. Restart terminal

#### Step 2: Install Bore
```powershell
cargo install bore-cli
# Wait 2-5 minutes for compilation
```

#### Step 3: Test Bore
```powershell
bore local 25565 --to bore.pub
# Should show: listening at bore.pub:xxxxx
```

---

## 📱 ANDROID/TERMUX

### Prerequisites: Termux App
- Install from: F-Droid (https://f-droid.org/packages/com.termux/)
- ⚠️ Don't use Play Store version (outdated)

### Step 1: Update Termux Packages
```bash
pkg update && pkg upgrade -y
```

### Step 2: Install Rust
```bash
pkg install rust -y
# This takes 5-10 minutes
# Downloads ~200MB, installs ~1GB
```

### Step 3: Install Bore
```bash
cargo install bore-cli
# Wait 10-15 minutes (compiling on phone is slow)
```

### Step 4: Test Bore
```bash
bore local 25565 --to bore.pub
# Should show: listening at bore.pub:xxxxx
```

### Step 5: Use in RedStone CLI
```bash
# Once bore is installed:
redstonenode
# Select server → Start
# Choose "Yes" for tunneling
# CLI will detect bore and use it automatically
```

---

## 🎯 QUICK COMPARISON

| Service | Windows | Android | Setup Time | Account Needed |
|---------|---------|---------|------------|----------------|
| **Playit.gg** | ✅ Auto | ⚠️ Manual | 30 seconds | No |
| **Bore** | ⚠️ 20 min setup | ⚠️ 20 min setup | 20 minutes | No |
| **Cloudflared** | ✅ Auto | ⚠️ Manual | 1 minute | No |
| **Ngrok** | ⚠️ Manual | ⚠️ Manual | 5 minutes | Yes |

---

## 💡 RECOMMENDATION

### For Windows:
✅ **Use Playit.gg** (already working in your CLI)
- No setup needed
- Works immediately
- Auto-downloads binary

### For Android:
✅ **Install Bore manually** (if you want automated tunneling)
```bash
pkg install rust -y
cargo install bore-cli
```

### Both Platforms:
✅ Your CLI already supports all of these!
- Just run: `redstonenode`
- Start a server
- Choose tunneling service
- CLI handles the rest

---

## 🐛 TROUBLESHOOTING

### Windows: "linker link.exe not found"
→ Need Visual Studio Build Tools (see above)

### Android: "command not found: cargo"
→ Run: `pkg install rust -y`

### Android: "bore: command not found"
→ After install, restart Termux and try again

### Any Platform: "connection refused" or "timeout"
→ bore.pub server might be down, try again or use Playit.gg
