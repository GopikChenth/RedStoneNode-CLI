# RedStone CLI v2.1

> Fast, lightweight Minecraft server manager

## 🚀 Quick Start

```bash
npm install -g redstonenode-cli
redstone
```

## ✨ Features

### Core
- ⚡ **Lightning Fast** - Minimal dependencies (~7.2KB compressed)
- 🎮 **Simple** - Intuitive menu-driven interface
- 📱 **Cross-Platform** - Windows, Linux, Android (Termux)
- 🔧 **Zero Config** - Works out of the box

### Server Management (New in v2.1)
- 🛑 **Stop Server** - Platform-specific process termination
  - Windows: WMIC/taskkill
  - Linux/Android: screen/tmux/ps kill
- 🌍 **World Management**
  - 💾 Backup worlds with timestamps
  - 📦 Restore from backups
  - 📤 Export to custom locations
  - 📥 Import from zip files
  - 🗑️ Delete worlds safely
- ⚙️ **Server Properties Editor**
  - Edit 12+ properties (max-players, gamemode, difficulty, pvp, whitelist, etc.)
  - Manage OP list with 4 permission levels
  - Whitelist management
  - Direct file editing
- 📂 **Custom Directories** - Choose installation location

### Networking
- 🌐 **Tunneling Services** - Playit.gg, Bore, LocalTunnel
- 🔗 **Smart URL Detection** - gl.joinmc.link, joinmc.link, playit.gg
- 🎯 **Platform Defaults**
  - Windows → Playit.gg
  - Linux/Android → Bore
- 📚 **First-Time Tutorial** - Interactive Playit.gg setup guide

## 📦 Supported Server Types

- Vanilla
- Paper (Recommended)
- Fabric
- Forge

## 🎯 Usage

### Create Server
```bash
redstone
# Select "Create New Server"
# Choose type, version, and RAM
```

### Start Server
```bash
redstone
# Select "Start Server"
# Choose server from list
# Optional: Enable Playit.gg tunnel
```

### List Servers
```bash
redstone
# Select "List Servers"
```

## 💾 Data Location

All servers stored in: `~/.redstone/servers/`

## 📋 Changelog

### v2.1.0 (Latest)
- ✅ Stop Server functionality with platform-specific process termination
- ✅ Complete World Management system (Backup/Restore/Export/Import/Delete)
- ✅ Server Properties Editor with OP and Whitelist management
- ✅ Custom directory selection during server creation
- ✅ Platform-specific tunnel defaults (Windows: Playit, Linux/Android: Bore)
- ✅ First-time Playit.gg setup tutorial
- ✅ Enhanced URL detection (gl.joinmc.link format support)
- ✅ Clean output (removed debug messages)

### v2.0.0
- Complete rebuild for speed and efficiency
- Minimal dependencies, maximum performance
- Playit.gg automatic tunneling
- Cross-platform support

## 📝 License

MIT © RedStone Team

## 🔗 Links

- [GitHub](https://github.com/GopikChenth/RedStoneNode-CLI)
- [NPM](https://www.npmjs.com/package/redstonenode-cli)
