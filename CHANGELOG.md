# Changelog

## [2.4.2] - 2025-12-05

### ✨ New Features
- **Help Command**: `redstone help` (or `-h`, `--help`) for command usage
- **Version Command**: `redstone version` (or `-v`, `--version`) to show CLI version  
- **Tutorial Command**: `redstone tutorial` for quick start guide with platform-specific tips
- **README Rewrite**: Consolidated all docs into one comprehensive guide

### 🐛 Bug Fixes & Improvements
- **Mobile Box**: Fixed banner alignment (46 chars wide)
- **RAM Display**: Changed from MB to GB for better readability
- **Available RAM**: Shows device's total RAM during server creation
- **Menu Alignment**: Fixed emoji spacing in server management menu
- **Documentation**: Clear platform limitations (Bore/Playit compatibility)
- **Network Requirements**: Added broadband connection warning

---

## [2.4.1] - 2025-12-05

### 🐛 Bug Fixes
- **Mobile Width**: Optimized mobile UI to fit 45-55 character width
- Banner adjusted to 46 characters wide
- All mobile text indented consistently
- Shortened labels to fit small screens

---

## [2.4.0] - 2025-12-05

### ✨ Major Feature: Mobile-Optimized UI

**Two Distinct Interfaces:**

📱 **Mobile/Termux:**
- Compact main menu (Create, Servers, Exit)
- Vertical server list with clean formatting
- Simplified server info display
- Single-line address format
- Mobile-friendly banners

💻 **PC/Desktop:**
- Full main menu with all options
- Table-based server list
- Detailed boxed server info
- Multi-line formatted displays
- Full ASCII art banners

### 🔧 Technical
- Detects Termux environment for UI switching
- Platform-specific box widths and formatting
- Optimized for small terminal screens
- Maintains all functionality on both platforms

---

## [2.3.3] - 2025-12-05

### 🐛 Bug Fixes
- **Android Stop Server**: Fixed "No running server found" error on Termux
- Now correctly finds and kills java processes running server.jar
- Also kills Bore tunnel when stopping server on Android
- Supports multiple java processes (kills all matching)

### 🔧 Improvements
- Simpler process search on Android (looks for "java.*server.jar")
- Platform-specific process detection (Termux vs Linux/Mac)
- Better error handling for already-stopped processes

---

## [2.3.2] - 2025-12-05

### 🐛 Critical Fix
- **Vanilla Version Download**: Fixed hardcoded version hash that always downloaded same version
- Now dynamically fetches correct server.jar from Mojang version manifest
- Vanilla servers now download the EXACT version you select (1.21.4, 1.20.6, etc.)

### 🔧 Technical Changes
- Queries Mojang's version_manifest_v2.json to get correct download URL
- Validates version exists before downloading
- Proper error handling for invalid versions

---

## [2.3.1] - 2025-12-05

### 🐛 Bug Fixes  
- Enhanced duplicate server detection in list command
- Added version mismatch warning before starting server
- Better Bore connection error explanations

### 📝 Important Notes
- **Version Mismatch**: If Minecraft says "Outdated client/server", your client version doesn't match the server
  - Solution: Use Minecraft client version 1.20.6 for a 1.20.6 server (or recreate server with correct version)
- **Bore Errors**: "could not connect to localhost:25565" while starting is normal
  - Server takes 10-15 seconds to start, Bore waits for it
  - Once server shows "Done!", connection will work

---

## [2.2.2] - 2025-12-05

### 🐛 Bug Fixes
- **Duplicate Servers**: Enhanced duplicate detection to check both folder name and config name
- **Version Mismatch Warning**: Shows server version and warns about client compatibility
- **Bore Timing**: Added note about server startup delay (Bore connects before server ready)

### 🔧 Improvements
- Better error messages when Bore cannot connect to localhost:25565
- Shows server type and version before starting
- Improved duplicate server filtering in list

### 📝 Known Issues
- Bore may show "could not connect to localhost:25565" errors while server is starting
- This is normal - Bore is ready but waiting for Minecraft server (takes ~10-15 seconds)
- Connection will work once server finishes starting

---

## [2.2.1] - 2025-12-05

### ✨ Major Features
- **Playit Support for Android/Termux**: Full Playit.gg integration for Android devices
  - Choice between Playit (recommended) or Bore when starting servers
  - Automatic download of ARM64/ARMv7 Playit binaries
  - Android-specific setup instructions in tutorial
  - Much more reliable than Bore (works through most networks)

### 🔧 Improvements
- **Tunnel Selection**: Android users can now choose tunnel service
- **Better Architecture Detection**: Supports ARM64, ARMv7, and AMD64
- **Android-Aware Tutorial**: Shows Termux-specific tips during setup
- **Enhanced Documentation**: TERMUX-SETUP.md now recommends Playit over Bore

### 🐛 Bug Fixes
- Better Bore error messages when connection times out
- Guidance for when bore.pub is blocked/unreachable
- Suggests alternatives when Bore fails

---

## [2.2.1] - 2025-12-05

### 🔧 Improvements
- **Bore Troubleshooting**: Added warnings about bore.pub reliability
- **Connection Testing**: Shows commands to test Bore connection (ps, nc)
- **Better Guidance**: Suggests Playit as more reliable alternative
- **TERMUX-SETUP.md**: Added comprehensive Bore connection troubleshooting section

### 📝 Documentation
- Added steps to check if Bore process is running
- Added network connectivity test command
- Explains common Bore failure reasons (unreliable service, network blocks)

---

## [2.2.0] - 2025-12-05

### 🐛 Critical Hotfix
- **Syntax Fix**: Properly fixed try-catch-finally structure in startBoreTunnel
- Corrected brace indentation causing "Missing catch or finally" error
- Validated with Node.js syntax checker

---

## [2.1.9] - 2025-12-05

### 🐛 Hotfix
- **Syntax Error**: Fixed broken try-catch block causing "Missing catch or finally" error
- Corrected Promise structure in startBoreTunnel function

---

## [2.1.8] - 2025-12-05

### 🐛 Critical Fix
- **Termux Detection**: Fixed Termux/Android detection that was causing Bore to fail
  - Now checks PREFIX, HOME path, and /data/data/com.termux existence
  - Removed duplicate code paths that caused silent failures
  - Added debug output showing platform detection status
- **Bore Output**: Now shows `[BORE OUTPUT]` on all platforms for debugging

### 🔧 Improvements
- Shows platform, Termux status, and PREFIX variable at tunnel start
- Unified code path for all platforms (no more hidden branches)
- Better error messages when Bore fails

---

## [2.1.7] - 2025-12-05

### 🐛 Bug Fixes
- **Bore Detection**: Enhanced pattern matching with multiple regex variations
- **Debug Output**: Added `[BORE OUTPUT]` markers for troubleshooting
- **Manual Fallback**: Provides clear instructions when auto-detection fails
- **Port Validation**: Validates detected port numbers (1024-65535 range)

### 🔧 Improvements
- Better fallback to manual entry with helpful guidance
- Shows how to check Bore status manually (`ps aux | grep bore`)
- More robust port number extraction from Bore output

---

## [2.1.6] - 2025-12-05

### ✨ Features
- **Automated Bore Tunnel**: Bore tunnel now fully automated on Android/Termux
  - Auto-detects `bore.pub:XXXXX` address from output
  - No manual entry required
  - Still shows connection progress in real-time
  - 15-second smart detection with buffer fallback

### 🔧 Improvements
- Hybrid output approach: captures AND displays Bore connection
- Better regex matching for tunnel address extraction
- Improved error handling for tunnel failures

---

## [2.1.5] - 2025-12-05

### 🐛 Bug Fixes
- **Android/Termux Server Startup**: Simplified Java execution (removed setsid wrapper)
- **Port Conflict Resolution**: Aggressive multi-attempt kill process (pkill → pkill -9 → killall -9)
- **Bore Force on Android**: Explicitly forces Bore tunnel on Termux (no more Playit confusion)
- **Display Fix**: Shows correct "Bore address entered manually" message on Android instead of Playit references

### 🔧 Improvements
- Longer wait time (3 seconds) for port cleanup
- Direct Java process spawning on Android (more reliable)
- Better error handling for process termination
- Platform-specific tunnel service detection

---

## [2.1.4] - 2025-12-05

### 🔧 Improvements
- All improvements from 2.1.3 now fully deployed

---

## [2.1.3] - 2025-12-05

### 🐛 Bug Fixes
- **Bore Tunnel**: Fixed Bore not working on Android/Termux
  - Now uses `stdio: 'inherit'` to show direct output on Android
  - Checks `~/.cargo/bin/bore` path automatically
  - Interactive prompt to enter Bore address after connection
  - Better error handling and timeout management
- **Duplicate Servers**: Fixed servers appearing twice in list
  - Added check to prevent duplicates from .link files
  - Only creates .link files for non-default locations
  - Improved server path resolution
- **Port Conflict Detection**: Checks if port 25565 is in use before starting
  - Shows clear error message and solution
  - Offers option to force start or cancel
  - Platform-specific troubleshooting instructions

### ✨ New Features
- **Android/Termux Shared Storage** (Major improvement!)
  - Default server location changed to `/storage/emulated/0/Documents/RedStone-Servers/`
  - Easy access with any file manager app (no special URIs needed)
  - Three location options: Shared Storage (recommended), Termux Home, Custom
  - Added `termux-setup-storage` requirement to setup guide

### 🔧 Improvements
- **Enhanced "Open Files" option**
  - Shows all 3 access methods on Android (Document URI, Direct Path, Termux Home)
  - Added helper function for better path display
  - Automatic `termux-open` command with fallback to manual paths
  - Platform-specific file manager opening (Windows Explorer, macOS Finder, Linux xdg-open)

### 📝 Documentation
- Added First-Time Setup section emphasizing `termux-setup-storage`
- Updated TERMUX-SETUP.md with new default location
- Clear explanation of shared storage benefits

### 📝 Notes
Android users: Run `termux-setup-storage` before creating servers for best experience!

---

## [2.1.2] - 2025-12-05

### 🐛 Bug Fixes
- **Bore Tunneling**: Made Bore installation optional
  - Server now starts successfully even without Bore installed
  - Shows clear installation instructions for Rust + Bore
  - Termux-specific PATH setup guidance
  - Platform-specific recommendations (Playit for Windows, Bore for Linux/Android)
- **Server Path Display**: Added full directory path in server info box
  - Shows exact location of server files
  - Helps users locate world folder and configuration files
  - Displays path on server creation
- **Termux Documentation**: Enhanced TERMUX-SETUP.md
  - Detailed Bore installation steps with PATH setup
  - Server file location troubleshooting
  - Memory requirements for Bore compilation

### 📝 Notes
Bore is optional - your server will work on local network without it!

---

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
