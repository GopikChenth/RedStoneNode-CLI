# 🎮 RedStone CLI

> Fast, lightweight Minecraft server manager for Windows, Linux, and Android

[![npm version](https://img.shields.io/npm/v/redstonenode-cli.svg)](https://www.npmjs.com/package/redstonenode-cli)
[![npm downloads](https://img.shields.io/npm/dm/redstonenode-cli.svg)](https://www.npmjs.com/package/redstonenode-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Create and manage Minecraft servers with a simple CLI. Works on PC and Android (Termux). Includes automated tunneling for online play.

---

## 📦 Installation

### Windows / Linux / Mac
```bash
npm install -g redstonenode-cli
redstone
```

### Android (Termux)
```bash
# Install dependencies
pkg update && pkg upgrade
pkg install nodejs git openjdk-21

# Install RedStone CLI
npm install -g redstonenode-cli

# Setup storage access
termux-setup-storage

# Run
redstone
```

> **Note**: Java 21 is required for Minecraft 1.20+. For older versions (1.19 and below), use `openjdk-17`.

---

## 🚀 Quick Start

```bash
# Start interactive menu
redstone

# Show help
redstone help

# Show version
redstone version

# Quick tutorial
redstone tutorial
```

**First Time?** Just run `redstone` and follow the prompts to create your first server!

---

## ✨ Features

### 🎯 Core
- **4 Server Types**: Vanilla, Paper, Fabric, Forge
- **Multi-Version**: 1.21.4 down to 1.12.2
- **Easy Management**: Start, stop, configure from one menu
- **Cross-Platform**: Optimized for Windows, Linux, Mac, and Android

### 🌍 World Management
- Backup/Restore worlds with timestamps
- Export worlds to custom locations
- Import worlds from zip files
- Delete worlds safely

### ⚙️ Server Configuration
- Edit server properties (gamemode, difficulty, max-players, PvP, etc.)
- OP list management (4 permission levels)
- Whitelist management
- Direct file editing

### 🌐 Online Play (Tunneling)

**⚠️ IMPORTANT: You need a broadband connection (not mobile data) for port forwarding to work!**

| Platform | Tunnel | Status |
|----------|--------|--------|
| **Windows** | Playit.gg | ✅ Recommended |
| **Windows** | Bore | ❌ Not supported |
| **Linux** | Playit.gg | ✅ Works |
| **Linux** | Bore | ✅ Works |
| **Android/Termux** | Bore | ✅ Working |
| **Android/Termux** | Playit.gg | ❌ Not supported (ARM64 issues) |

**Mobile ISPs block port forwarding** - You MUST use home WiFi/broadband for online servers!

#### Setup Playit.gg (Windows/Linux)
```bash
# Download from https://playit.gg
# Run the installer
# Create account and claim tunnel
# RedStone CLI will detect it automatically
```

#### Setup Bore (Linux only)
```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Bore
cargo install bore-cli

# RedStone CLI will use it automatically
```

---

## 📱 Platform-Specific Notes

### Windows
- ✅ Full feature support
- ✅ Playit.gg recommended for tunneling
- 📁 Servers stored in: `C:\Users\<user>\.redstone\servers\`

### Linux / Mac
- ✅ Full feature support
- ✅ Playit.gg or Bore for tunneling
- 📁 Servers stored in: `~/.redstone/servers/`

### Android (Termux)
- ✅ Optimized mobile UI
- ✅ Shared storage support: `/storage/emulated/0/Documents/RedStone-Servers/`
- ⚠️ Bore tunneling unreliable (service issues)
- ⚠️ Keep Termux awake with `termux-wake-lock`
- ⚠️ Requires broadband connection (not mobile data)
- ⚠️ Some modded servers may not work on ARM architecture

---

## 🎮 Usage Examples

### Create a Server
```bash
redstone
# Select: Create
# Choose: Paper (recommended)
# Version: 1.21.4
# RAM: 2GB (shows your available RAM)
# Location: Shared Storage (Android) or Default
```

### Start & Share Online
```bash
redstone
# Select: Servers
# Choose your server
# Select: Start Server
# Share the tunnel address with friends
# Example: game-name.gl.joinmc.link:25565
```

### Manage Server
```bash
redstone
# Select: Servers
# Choose your server
# Options:
#   - Server Properties (edit settings)
#   - World Management (backup/restore)
#   - Stop Server (safe shutdown)
#   - View Logs (check output)
```

---

## 🔧 Troubleshooting

### "Can't connect to server"
- ✅ Verify you're on broadband (not mobile data)
- ✅ Check firewall settings
- ✅ Ensure tunnel is running
- ✅ Use correct address (including port)

### "Bore connection timeout"
- ⚠️ bore.pub servers are often down
- ✅ Try Playit.gg instead (if on PC)
- ✅ Check internet connection

### Android: "Server won't start"
- ✅ Keep Termux awake: `termux-wake-lock`
- ✅ Check Java installed: `java -version`
- ✅ Verify RAM available: 2GB+ recommended
- ✅ Some mods incompatible with ARM

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `redstone` | Start interactive menu |
| `redstone help` | Show help message |
| `redstone version` | Show version |
| `redstone tutorial` | Quick start guide |

---

## 🛠️ Requirements

- **Node.js** 14.0.0 or higher
- **Java**:
  - Java 21+ (Minecraft 1.20+)
  - Java 17+ (Minecraft 1.18-1.19)
  - Java 8+ (Minecraft 1.17 and below)
- **RAM**: 2GB+ recommended for smooth gameplay
- **Internet**: Broadband connection required for online play

---

## 📝 License

MIT © RedStone Team

**Support**: [GitHub Issues](https://github.com/GopikChenth/RedStoneNode-CLI/issues)  
**NPM**: [redstonenode-cli](https://www.npmjs.com/package/redstonenode-cli)

## 🔗 Links

- [GitHub](https://github.com/GopikChenth/RedStoneNode-CLI)
- [NPM](https://www.npmjs.com/package/redstonenode-cli)
