# Changelog

All notable changes to RedStone-CLI will be documented in this file.

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
