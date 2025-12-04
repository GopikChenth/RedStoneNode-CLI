# Changelog

All notable changes to RedStone-CLI will be documented in this file.

## [1.4.0] - 2025-12-04

### Added
- 🚂 **RAILWAY-GUIDE.md** - Complete Railway deployment guide for Minecraft servers
- ☁️ Railway as proxy server setup (HAProxy + Bore tunnel)
- 🤖 Automated deployment scripts for Windows (PowerShell) and Linux/Mac
- 📦 Docker configuration files for Railway deployment
- 🔄 Keep-alive GitHub Actions workflow to prevent service sleeping
- 💰 Railway free tier optimization ($5/month credit guide)
- 📊 Railway vs other platforms comparison table
- 🎯 One-command Railway deployment with interactive setup

### Documentation
- Railway account setup and CLI installation
- HAProxy TCP proxy configuration for Minecraft
- Environment variable management on Railway
- Cost estimation and free tier limits
- Service monitoring and log viewing
- Troubleshooting guide for Railway deployment
- Uptime Robot integration for keep-alive

### Scripts
- `deploy-railway.sh` - Linux/Mac/Termux deployment automation
- `deploy-railway.ps1` - Windows PowerShell deployment automation
- `keep-alive.yml` - GitHub Actions workflow for service monitoring
- Dockerfile for HAProxy 2.8 Alpine with health checks
- railway.json for optimal deployment settings

## [1.3.9] - 2025-12-04

### Enhanced
- 📚 **Detailed Oracle Cloud setup** - Step-by-step with screenshots instructions
- 🤖 **3 automation scripts**: Complete proxy setup, Bore auto-restart, Health monitor
- 🎯 One-command installation script with interactive menu
- 🔐 Firewall configuration automation for Oracle Cloud
- 📊 Health check monitoring with auto-restart
- 🔄 Bore auto-reconnect script for local device

### Added
- Oracle Cloud VM creation walkthrough (4 CPU, 24GB RAM free)
- SSH key setup instructions for Windows/Linux/Termux
- Systemd service files for production deployment
- Log file management for all scripts
- Interactive setup wizard with input validation

### Documentation
- Complete Oracle Cloud account creation guide
- Detailed firewall ingress rules setup
- SSH connection troubleshooting
- Service monitoring and management commands

## [1.3.8] - 2025-12-04

### Added
- 📚 **CLOUD-PROXY-GUIDE.md** - Complete guide for building Aternos-like proxy setup
- ☁️ 4 professional proxy methods: HAProxy+Bore, Nginx+SSH, Cloudflare Spectrum, WireGuard+HAProxy
- 🆓 Oracle Cloud Always Free tier guide (24GB RAM!)
- 🤖 Automation script for quick proxy setup
- 📊 Comparison table of all proxy methods
- 🔧 Troubleshooting section for common proxy issues

### Documentation
- Professional cloud hosting setup guide
- Static IP solution for mobile servers
- DDoS protection strategies
- Load balancing configuration
- VPN tunnel setup with WireGuard

## [1.3.7] - 2025-12-04

### Added
- 🚫 Intelligent bore.pub failure detection and handling
- 🔄 Quick switch to Playit.gg when bore.pub is down
- ❓ Interactive menu: Switch to Playit.gg / Retry / Cancel
- 💾 Automatic config update when switching tunnel services

### Fixed
- ⚠️ Detects "could not connect" and "timed out" errors from bore.pub
- 🔧 Handles bore.pub server downtime gracefully
- 💔 No more hanging when bore.pub is unreachable
- ⏱️ Increased wait time to 5 seconds for better connection detection

### Changed
- 💡 Recommends Playit.gg when bore.pub fails (more reliable)
- 🔪 Allows empty input to cancel tunnel setup
- 📝 Better error messages explaining bore.pub issues

## [1.3.6] - 2025-12-04

### Fixed
- 🎯 Fixed Bore detection on Android by checking ~/.cargo/bin/bore FIRST
- 🔍 Now finds bore even when not in PATH (common Termux issue)
- 🛤️ Direct path resolution: ~/.cargo/bin/bore used before 'which' command

### Changed
- 🥇 Priority order: 1) ~/.cargo/bin/bore, 2) PATH (which bore)
- 🚀 Works immediately after cargo install without PATH setup

## [1.3.5] - 2025-12-04

### Fixed
- ✅ Added Bore installation check before attempting to start tunnel on Android
- 🔒 Removed shell:true to fix Node.js security warning (DEP0190)
- 📂 Check ~/.cargo/bin/bore path if 'which bore' fails
- 📝 Clear installation instructions when Bore not found

### Changed
- 🚫 Prevents "bore: not found" error by checking installation first
- 💬 Shows helpful install commands: pkg install rust, cargo install bore-cli
- 👉 Suggests Playit.gg alternative if user doesn't want to wait for installation
- 🔧 Removed automatic installation attempt (was unreliable)

## [1.3.4] - 2025-12-04

### Fixed
- ⏱️ Added 3-second wait for Bore output on Android before prompting
- 📊 Visual separators to clearly show Bore output section
- 📋 Better instructions: "Look for the line above that says 'listening at bore.pub:XXXXX'"
- 🖊️ Default input value 'bore.pub:' to guide user format

### Changed
- 🎨 Improved Android UX with clearer output formatting
- ⏸️ Spinner stops before showing Bore output (cleaner display)
- 📝 Enhanced validation messages
- 👉 More helpful prompt text

## [1.3.3] - 2025-12-04

### Fixed
- 🤖 Fixed Bore tunnel on Android/Termux by using direct stdio output
- 📋 Added manual input prompt for bore.pub address on Android
- 🔧 Bore now shows output directly in terminal on Termux
- ✅ Users can copy/paste the bore.pub:port address when prompted

### Changed
- 📱 Android/Termux now uses stdio: 'inherit' for Bore to show direct output
- 💬 Interactive prompt asks user to manually enter tunnel address on Android
- 🎯 Address validation ensures correct bore.pub:port format

## [1.3.2] - 2025-12-04

### Fixed
- 🐛 Fixed Bore tunnel URL not being captured on Android/Termux
- 🔍 Added debug output logging for Bore process
- 📊 Improved output pattern matching for bore.pub addresses
- 🔧 Enhanced error reporting with full output buffer
- 🌐 Fixed process attachment to properly capture tunnel address

### Changed
- 📝 Better error messages showing actual Bore output
- 🐞 Added multiple regex patterns to catch bore.pub:port format
- ⚡ Removed process.unref() to maintain stdio connection

## [1.3.1] - 2025-12-04

### Added
- 📖 Comprehensive BORE-SETUP-GUIDE.md with detailed Windows and Android installation instructions
- 📊 Comparison table for all tunnel services (Playit.gg, Bore, Cloudflared, Ngrok)
- 🔧 Troubleshooting section for common Bore compilation issues

### Changed
- 📝 Improved documentation for tunnel service selection and setup
- 💡 Added recommendations for optimal tunnel service based on platform
- ⚠️ Clarified Visual Studio Build Tools requirement for Bore on Windows

### Documentation
- Complete walkthrough for Bore installation on Windows (with VS Build Tools requirement)
- Complete walkthrough for Bore installation on Android/Termux
- Service comparison matrix showing setup time, platform support, and account requirements
- Alternative solutions when compilation tools are not available

## [1.3.0] - 2025-12-03

### Added
- 🌐 Automated tunnel service integration for easy server sharing
- 🚀 Playit.gg full automation (binary auto-download, no account needed)
- 🔗 Tunnel URL persistence in server configuration
- 📺 Tunnel URL display in server running page
- 🔄 Multi-path server detection (cwd, HOME, HOME/minecraft, HOME/Documents)
- 🏠 Return to menu after server stop
- 📦 Added tunnel service dependencies (ngrok, localtunnel)

### Changed
- 🎯 Default tunnel service set to Playit.gg for reliability
- 📋 Enhanced server info display with public/local address sections
- 🔧 Improved tunnel service routing and error handling

### Fixed
- ✅ Server detection now searches multiple common directories
- 🐛 Tunnel URL now properly saved and displayed across sessions
- 🔄 Config persistence for tunnel service preferences

### Technical
- Added ngrok@5.0.0-beta.2 dependency
- Added localtunnel@2.0.2 dependency
- Enhanced tunnel.js with automated Playit.gg support
- Updated list.js with tunnel URL integration

## [1.0.0] - 2025-11-23

### Added
- 🎉 Initial release of RedStone-CLI
- 🚀 Server initialization with interactive prompts
- ▶️ Start/Stop server commands with background process management
- 📋 List all servers with status and resource info
- 🌍 World management (create, switch, delete, list)
- ⚙️ Configuration management for server.properties, ops, whitelist
- ☕ Automatic Java detection for Windows, Linux, and Android (Termux)
- 📦 Auto-download support for Vanilla, PaperMC, and Fabric servers
- 🎨 Beautiful CLI interface with ASCII art banner
- 💾 JSON-based configuration system
- 🔧 Support for multiple server types:
  - Vanilla (Official Mojang)
  - PaperMC
  - Spigot
  - Fabric
  - Forge
- 🖥️ Cross-platform support (Windows, Linux, Android/Termux)
- 📖 Comprehensive documentation (README, QUICKSTART)
- ✅ Automatic EULA acceptance
- 💾 RAM allocation presets (4GB Windows, 3GB Android)
- 🔒 Process ID tracking for server management
- 📊 Server status monitoring

### Features
- Interactive menu-driven interface
- Color-coded output for better readability
- Spinner animations for long-running operations
- Error handling with helpful messages
- Platform-specific Java installation instructions
- One server at a time execution model
- Configurable server directory locations
- Version specification for Minecraft releases

### Technical
- Node.js 14.0.0+ compatibility
- Dependencies:
  - chalk 4.1.2 (terminal styling)
  - commander 11.1.0 (CLI framework)
  - inquirer 8.2.5 (interactive prompts)
  - ora 5.4.1 (spinners)
  - boxen 5.1.2 (boxes)
  - figlet 1.7.0 (ASCII art)
  - cli-table3 0.6.3 (tables)
  - axios 1.6.2 (HTTP client)
  - fs-extra 11.2.0 (file system)
  - node-fetch 2.7.0 (fetch API)

### Documentation
- Full README with installation instructions
- Quick start guide
- Troubleshooting section
- Platform-specific setup guides
- MIT License

## [Unreleased]

### Planned Features
- [ ] Plugin/Mod installer
- [ ] Automated backups with scheduling
- [ ] Performance optimization presets
- [ ] Multi-server simultaneous management
- [ ] REST API for GUI integration
- [ ] Docker container support
- [ ] Web-based dashboard
- [ ] Server templates
- [ ] Automatic updates
- [ ] Log viewer/filtering in CLI
- [ ] Server performance metrics
- [ ] Player management commands
- [ ] Backup restore functionality
- [ ] Custom server startup scripts
- [ ] Plugin dependency resolver

---

## Version Format
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

## Release Types
- 🎉 **Added** for new features
- 🔧 **Changed** for changes in existing functionality
- 🗑️ **Deprecated** for soon-to-be removed features
- 🚫 **Removed** for now removed features
- 🐛 **Fixed** for any bug fixes
- 🔒 **Security** for vulnerability fixes
