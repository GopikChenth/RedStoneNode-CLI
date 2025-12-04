# Changelog

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
