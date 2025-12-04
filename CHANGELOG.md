# Changelog

## [2.1.1] - 2025-12-04

### 🐛 Bug Fixes
- **Android/Termux Support**: Fixed server startup on Android devices
  - Added Termux environment detection
  - Use `setsid` for background processes (available in Termux by default)
  - No longer requires screen/tmux/nohup installation
  - Added wake-lock support for termux-api
  - Creates startup script for reliable execution
  - Better fallback handling for various Linux environments
- **Documentation**: Added comprehensive TERMUX-SETUP.md guide
  - Installation instructions
  - Battery optimization tips
  - RAM recommendations for mobile devices
  - Troubleshooting guide

### 📝 Notes
If you're on Termux and had issues before, this update should fix them!

---

## [2.1.0] - 2025-12-04

### 🎉 Major Feature Update

### ✨ New Features
- 🛑 **Stop Server** - Platform-specific process termination
  - Windows: WMIC/taskkill for Java processes
  - Linux/Android: screen/tmux/ps detection and kill
  - Automatic Playit tunnel cleanup
- 🌍 **World Management System**
  - Backup worlds with timestamped archives
  - Restore from backup list
  - Export worlds to custom locations
  - Import worlds from zip files
  - Safe world deletion
- ⚙️ **Server Properties Editor**
  - Edit 12+ properties (max-players, gamemode, difficulty, pvp, whitelist, online-mode, etc.)
  - Manage OP list with 4 permission levels (1-4)
  - Whitelist management (add/remove players)
  - Direct file editing for server.properties, ops.json, whitelist.json
- 📂 **Custom Directory Selection** - Choose server installation location during creation
- 🎯 **Platform-Specific Defaults**
  - Windows: Playit.gg (recommended)
  - Linux/Android: Bore (lightweight, fast)
- 📚 **First-Time Tutorial** - Interactive Playit.gg setup guide with visual instructions
- 🔗 **Enhanced URL Detection** - Support for gl.joinmc.link and joinmc.link formats
- 🧹 **Clean Output** - Removed debug messages for cleaner UI

### 📦 Dependencies Added
- archiver@5.3.2 - World backup compression
- extract-zip@2.0.1 - World restore extraction

### 🐛 Bug Fixes
- Fixed Playit URL not showing in server info box (gl.joinmc.link pattern)
- Improved tunnel URL capture reliability

---

## [2.0.0] - 2025-12-04

### 🎉 Complete Rebuild

**Why v2.0?**
- Complete rewrite from scratch
- Removed bloat and unnecessary features
- Focus on performance and simplicity

### ✨ New Features
- ⚡ **10x Faster** - Minimal dependencies (5 vs 14)
- 🎯 **Simple** - 3 core commands only
- 📦 **Smaller** - 79 packages vs 200+
- 🧹 **Clean Code** - Modular and maintainable
- 🌐 **Playit.gg** - Built-in tunneling support

### 📊 Performance Improvements
- Startup time: **< 1 second** (was 3-5s)
- Package size: **~5MB** (was ~20MB)
- Memory usage: **< 50MB** (was ~150MB)

### 🗑️ Removed Features (Bloat)
- Railway integration (complex, limited use)
- Bore tunnel (unreliable public server)
- Cloudflared (HTTPS-only, not for Minecraft)
- Ngrok (unreliable npm package)
- LocalTunnel (HTTP-only)
- Complex configuration UI
- Unnecessary dependencies

### 📦 Core Features
- ✅ Create servers (Vanilla, Paper, Fabric, Forge)
- ✅ Start servers with Playit.gg tunnel
- ✅ List all servers
- ✅ Auto EULA acceptance
- ✅ Cross-platform (Windows, Linux, Termux)

### 🎯 Philosophy
**v2.0 follows:**
- KISS (Keep It Simple, Stupid)
- Do one thing and do it well
- Performance over features
- Reliability over complexity

---

## [1.x.x] - Legacy Versions

Previous versions (1.0.0 - 1.4.1) were feature-rich but bloated. 
They're archived in git history.

### Issues with v1.x:
- Too many dependencies
- Complex tunnel management
- Railway/Cloud hosting overkill for most users
- Slow startup time
- High memory usage
- Maintenance burden

**v2.0 solves all of these issues.**
