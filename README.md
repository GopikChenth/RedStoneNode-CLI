# RedStone-CLI 🎮⛏️

> **A powerful, cross-platform CLI tool for managing Minecraft Java Edition servers with ease!**

Cross-platform command-line tool for managing Minecraft Java Edition servers on **Windows**, **Linux**, and **Android (Termux)**.

![Version](https://img.shields.io/badge/version-1.0.0-red)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20Android-lightgrey)

## 📦 Quick Install

```bash
npm install -g redstonenode-cli
```

Then run:
```bash
redstonenode
```

## ✨ Features

### 🚀 Server Management
- **Easy Initialization** - Create new servers in seconds with guided setup
- **One-Click Start/Stop** - Launch servers with interactive console access
- **Server List View** - Beautiful table showing all servers with status, version, and specs
- **Process Management** - Automatic Java process cleanup and monitoring
- **Console Access** - Direct console window for server commands and logs

### ⚙️ Advanced Configuration
- **Interactive Properties Editor** - GUI-style editor for all server settings:
  - 👥 **Max Players** (Slots) - Set player capacity
  - 🎮 **Gamemode** - Survival, Creative, Adventure, Spectator
  - ⚔️ **Difficulty** - Peaceful, Easy, Normal, Hard
  - 📋 **Whitelist** - Enable/disable whitelist mode
  - 🔓 **Cracked/Premium Mode** - Toggle online-mode for offline servers
  - 🎯 **Command Blocks** - Enable/disable command blocks
  - 👹 **Monster Spawning** - Control hostile mob spawns
  - ⚔️ **PVP** - Player vs Player combat toggle
  - ✈️ **Flight** - Allow flight in survival mode
  - 🔥 **Nether** - Enable/disable Nether dimension
  - 🎮 **Force Gamemode** - Force players to default gamemode
  - 🛡️ **Spawn Protection** - Set spawn protection radius

### 👑 Player Management
- **OP List Management** - Add/remove operators with permission levels:
  - Level 1: Bypass spawn protection
  - Level 2: Use cheat commands
  - Level 3: Use most commands
  - Level 4: Full admin access
- **Whitelist Management** - Add/remove players from whitelist
- **Real-time Updates** - Changes apply immediately to configuration files

### 🌐 Tunneling & Remote Access
- **Playit.gg Integration** - Built-in tunneling for public server access
- **Automatic Setup** - Downloads and configures tunnel agent
- **URL Display** - Shows public address in Server Running page
- **No Port Forwarding** - Play with friends without router configuration

### 🌍 World Management
- **Multiple Worlds** - Create and manage multiple world saves
- **World Switching** - Switch between worlds easily
- **World Deletion** - Clean up old worlds with confirmation

### 📦 Server Types & Downloads
- **Vanilla** - Official Minecraft server (auto-download)
- **PaperMC** - High-performance server (auto-download)
- **Fabric** - Modded server support (auto-download)
- **Spigot** - Plugin support (manual JAR)
- **Forge** - Mod support (manual JAR)
- **Version Selection** - Support for MC 1.12 through 1.21.4

### 🎨 Beautiful Interface
- **ASCII Art Banner** - Stylish REDSTONE logo on every page
- **Color-Coded UI** - Red theme with clear visual hierarchy
- **Boxed Layouts** - Information displayed in clean boxes
- **Interactive Menus** - Intuitive navigation with ESC key support
- **Progress Indicators** - Spinners and status messages

### 🔍 File Management
- **Open Server Folder** - Quick access to server files
- **View Logs** - Check server logs directly from CLI
- **Server Info Display** - View configuration and status at a glance

### 🛡️ Java Version Detection
- **Automatic Detection** - Finds Java installation automatically
- **Version Validation** - Ensures Java version matches MC requirements:
  - Java 17 for MC 1.18-1.20
  - Java 21 for MC 1.21+
- **Cross-Platform** - Works on Windows, Linux, and Termux

## 📋 Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Node.js** | 14.0.0+ | 18.0.0+ | Run the CLI tool |
| **npm** | 6.0.0+ | 9.0.0+ | Package management |
| **Java** | 17+ | 21+ | Run Minecraft server |

### Platform-Specific Installation

#### 🪟 Windows

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose LTS version (recommended)
   - Installer includes npm automatically

2. **Install Java**
   - Download from [Oracle Java](https://www.oracle.com/java/technologies/downloads/)
   - Choose Java 21 for best compatibility
   - Verify installation:
     ```powershell
     java -version
     node -v
     npm -v
     ```

#### 🐧 Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Java (OpenJDK 21)
sudo apt install -y openjdk-21-jdk

# Verify installations
java -version
node -v
npm -v
```

#### 📱 Android (Termux)

```bash
# Update Termux packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs

# Install Java 21 (Recommended for MC 1.21+)
pkg install openjdk-21

# Or install Java 17 (For MC 1.18-1.20)
# pkg install openjdk-17

# Verify installations
java -version
node -v
npm -v
```

### Minecraft Version Requirements

| Minecraft Version | Minimum Java | Recommended Java |
|-------------------|--------------|------------------|
| 1.12 - 1.16.5 | Java 8 | Java 11 |
| 1.17.x | Java 16 | Java 17 |
| 1.18 - 1.20.x | Java 17 | Java 17 |
| 1.21+ | Java 21 | Java 21 |

### System Requirements

#### Minimum Specs
- **RAM**: 2GB available (4GB total system RAM)
- **Storage**: 2GB free space
- **CPU**: Dual-core processor
- **Network**: Internet connection for downloads

#### Recommended Specs
- **RAM**: 4GB+ available (8GB total system RAM)
- **Storage**: 5GB+ free space
- **CPU**: Quad-core processor
- **Network**: Stable broadband connection

## 📥 Installation

### Option 1: NPM Global Install (Recommended)
```bash
npm install -g redstonenode-cli
```

### Option 2: From Source
```bash
git clone https://github.com/GopikChenth/RedStoneNode-CLI.git
cd RedStoneNode-CLI
npm install
npm link
```

## 🚀 Quick Start

### Launch RedStone-CLI

Simply run:
```bash
redstonenode
```

You'll see the beautiful RedStone menu:

```
██████╗ ███████╗██████╗ ███████╗████████╗ ██████╗ ███╗   ██╗███████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
██████╔╝█████╗  ██║  ██║███████╗   ██║   ██║   ██║██╔██╗ ██║█████╗  
██╔══██╗██╔══╝  ██║  ██║╚════██║   ██║   ██║   ██║██║╚██╗██║██╔══╝  
██║  ██║███████╗██████╔╝███████║   ██║   ╚██████╔╝██║ ╚████║███████╗
╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
                                                          v1.0.0
```

### Main Menu Navigation

```
First Page:
├── 🚀 Create a Server      → Initialize new Minecraft server
├── 📋 List Server          → View and manage all servers  
├── ❌ Exit                 → Close RedStone-CLI
└── Version: 1.0.0

Server List Page:
├── [Server 1] Name | Type | Version | RAM
├── [Server 2] Name | Type | Version | RAM
└── ← Back

Server Management Page (Per Server):
├── ▶️  Start Server        → Launch server with console
├── ⏹️  Stop Server         → Stop running server
├── 🌍 World                → Manage worlds
├── ⚙️  Server properties   → Configure server settings
├── 📁 Files                → Open folder, view logs
└── ← Back

Server Properties Page:
├── Slots (20)
├── Gamemode (survival)
├── Difficulty (easy)
├── Whitelist (disabled)
├── Cracked/Online Mode (Premium)
├── Command Blocks (enabled)
├── Monsters (enabled)
├── PVP (enabled)
├── Flight (disabled)
├── Nether (enabled)
├── Force Gamemode (disabled)
├── Spawn Protection (0)
├── 👑 OP List (X players)
├── 📋 Whitelist (X players)
└── ← Back

Server Running Page:
├── 📊 Server Info Box
│   ├── Status: RUNNING ✅
│   ├── Local: localhost:25565
│   ├── LAN: 192.168.x.x:25565
│   └── Public: xxx.gl.joinmc.link (if tunneling)
├── ⏹️  Stop Server
└── ← Back
```

### Navigation Controls
- **Arrow Keys** or **Enter**: Select options
- **ESC**: Go back to previous menu (Linux/Termux only)
- **Ctrl+C**: Exit application (emergency)

## 📖 Complete Usage Guide

### 🎯 Step 1: Create Your First Server

1. Launch `redstonenode`
2. Select **"🚀 Create a Server"**
3. Follow the setup wizard:

```
Setup Questions:
├── Server Name: my-awesome-server
├── Server Type: 
│   ├── Vanilla (Official)
│   ├── PaperMC (High Performance)
│   ├── Fabric (Mods)
│   ├── Spigot (Plugins)
│   └── Forge (Mods)
├── Minecraft Version: 1.21.4 (or any from 1.12+)
├── RAM Allocation: 4G (Windows/Linux) or 3G (Termux)
└── Port: 25565 (default)
```

**What happens next:**
- ✅ Java version detected and validated
- ✅ Server directory created
- ✅ Server JAR downloaded automatically (Vanilla/PaperMC/Fabric)
- ✅ EULA accepted automatically
- ✅ Configuration saved to `.redstone/config.json`
- ✅ Server ready to start!

### ▶️ Step 2: Start Your Server

1. From main menu, select **"📋 List Server"**
2. Choose your server from the table
3. Select **"▶️ Start Server"**

**Server Start Process:**
- 🧹 Cleans up any old Java processes
- 🚀 Launches server with console window
- 📊 Shows Server Running page with:
  - Local address: `localhost:25565`
  - LAN address: `192.168.x.x:25565`
  - Public tunnel (optional): `xxx.gl.joinmc.link`

**Tunnel Setup (Optional):**
- When starting, choose "Would you like to setup tunneling?"
- Select **Yes** to enable Playit.gg tunnel
- Public URL displayed automatically
- Share with friends to play together!

**Console Window:**
- Server runs in separate console
- Type Minecraft commands directly: `/say Hello!`, `/op PlayerName`
- View real-time logs
- Close console to stop server (or use Stop button)

### ⚙️ Step 3: Configure Server Properties

1. Navigate to **Server Management → ⚙️ Server properties**
2. Select property to edit:

**Toggle Properties (Click to enable/disable):**
- Whitelist
- Cracked/Premium Mode
- Command Blocks
- Monster Spawning
- PVP
- Flight
- Nether
- Force Gamemode

**Dropdown Properties:**
- Gamemode: Survival / Creative / Adventure / Spectator
- Difficulty: Peaceful / Easy / Normal / Hard

**Number Properties:**
- Slots (Max Players): 1-100000
- Spawn Protection: 0-999 blocks

### 👑 Step 4: Manage OPs and Whitelist

**Adding Operators:**
1. Go to **Server properties → 👑 OP List**
2. Select **"Add OP"**
3. Enter player username
4. Choose permission level:
   - Level 1: Bypass spawn protection
   - Level 2: Use cheat commands + Level 1
   - Level 3: Use most commands + Level 2
   - Level 4: All commands (Full Admin)
5. Confirmed! Player is now an operator

**Managing Whitelist:**
1. Enable whitelist in **Server properties**
2. Go to **📋 Whitelist**
3. Select **"Add player"**
4. Enter player username
5. Only whitelisted players can join!

**Removing Players:**
- Select player from list
- Choose **"Remove"**
- Changes apply immediately

### 🌍 Step 5: World Management

1. Navigate to **Server Management → 🌍 World**
2. Options available:
   - **Create new world**: Generate fresh world
   - **Switch world**: Change active world (updates server.properties)
   - **Delete world**: Remove old world saves
   - **View worlds**: See all world folders

### 📁 Step 6: File Management

Access server files easily:
- **Open server folder**: Quick access to all files
- **View logs**: Check latest.log and old logs
- **Manual edits**: Access any configuration file

### ⏹️ Step 7: Stop Your Server

**Method 1: Stop Button**
1. While server running, select **"⏹️ Stop Server"**
2. All Java processes terminated gracefully

**Method 2: Close Console**
- Close the server console window
- Use Stop button to ensure cleanup

**Automatic Cleanup:**
- All Java processes killed
- Server marked as stopped
- Ready to start again anytime

## 🔧 Configuration

### Server Configuration
Each server has a `.redstone/config.json` file:

```json
{
  "serverName": "my-server",
  "serverType": "vanilla",
  "minecraftVersion": "1.20.1",
  "javaPath": "java",
  "javaVersion": "17.0.8",
  "ramAllocation": "4G",
  "port": 25565,
  "autoBackup": false
}
```

### Platform-Specific Defaults

| Platform | Default RAM | Default Java |
|----------|-------------|--------------|
| Windows  | 4GB         | JAVA_HOME or PATH |
| Android  | 3GB         | Termux pkg |
| Linux    | 4GB         | JAVA_HOME or PATH |

## 🌍 World Management

Create multiple worlds for your server:

```bash
# In RedStone menu:
🌍 Manage worlds
  ➕ Create new world
  📋 List worlds
  🔄 Switch world (updates server.properties)
  🗑️  Delete world
```

## 🛠️ Supported Server Types

| Server Type | Auto-Download | Version Support |
|-------------|---------------|-----------------|
| **Vanilla** | ✅ Yes | All releases |
| **PaperMC** | ✅ Yes | 1.8+ |
| **Spigot**  | ❌ Manual | Requires BuildTools |
| **Fabric**  | ✅ Yes | 1.14+ |
| **Forge**   | ❌ Manual | Manual installation |

### Manual Installation (Spigot/Forge)
1. Initialize server with any type
2. Download JAR manually
3. Place in server directory as `server.jar`
4. Start normally

## 🐛 Troubleshooting

### Common Issues & Solutions

#### ❌ Java Not Found

**Android/Termux:**
```bash
pkg install openjdk-17
# Verify installation
java -version
```

**Windows:**
1. Download Java from [Adoptium](https://adoptium.net/)
2. Install with default settings
3. Open new PowerShell window
4. Verify: `java -version`

**Linux:**
```bash
sudo apt install openjdk-21-jdk
java -version
```

If still not detected:
```bash
# Set JAVA_HOME manually
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH=$PATH:$JAVA_HOME/bin
```

#### ❌ Server Won't Start

**Check Java Version:**
- MC 1.18-1.20 requires Java 17+
- MC 1.21+ requires Java 21+
- Run: `java -version`

**Port Already in Use:**
```bash
# Windows: Check port 25565
netstat -ano | findstr :25565
# Kill process with PID shown
taskkill /PID [PID] /F

# Linux/Termux:
lsof -i :25565
kill -9 [PID]
```

**File Lock Error: "Process cannot access file"**
- This is automatically fixed!
- RedStone-CLI kills old Java processes before starting
- If persists, manually stop all Java processes:
  ```powershell
  # Windows
  taskkill /IM java.exe /F
  ```

**Insufficient RAM:**
- Check available memory
- Reduce RAM allocation in server configuration
- Close other applications
- Recommended: 4GB for smooth gameplay

**Check Server Logs:**
```bash
# Navigate to server folder
cd my-awesome-server
# View latest log
cat logs/latest.log    # Linux/Termux
type logs\latest.log   # Windows
```

#### ❌ npm install -g fails

**Permission Issues (Linux/Termux):**
```bash
# Use npm prefix for user-level install
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g redstonenode-cli
```

**Or use sudo (not recommended for Termux):**
```bash
sudo npm install -g redstonenode-cli
```

#### ❌ Server Console Not Opening

**Windows:**
- Console opens automatically with server start
- Check Task Manager for Java process
- If hidden, look for console in taskbar

**Linux/Termux:**
- Console not available on these platforms
- Use `logs/latest.log` to monitor
- Or run server in terminal directly

#### ❌ Players Can't Connect

**Check Server is Running:**
- Green ✅ in Server Running page
- Console window should be open

**Firewall Issues:**
- Windows: Allow Java through firewall
- Router: Forward port 25565 (or use tunneling)

**Use Tunneling (Recommended):**
- Enable Playit.gg tunnel during server start
- Share the public URL: `xxx.gl.joinmc.link`
- Works without port forwarding!

**Verify IP Addresses:**
- Local: Use `localhost` on same PC
- LAN: Use `192.168.x.x` on same network
- Internet: Use tunnel URL or public IP

#### ❌ Whitelist Not Working

1. Enable whitelist in Server properties
2. Add players to whitelist
3. Restart server for changes to apply
4. Check `whitelist.json` exists in server folder

#### ❌ OP Commands Not Working

1. Add player to OP list with Level 4
2. Restart server
3. Player must reconnect
4. Check `ops.json` file

#### ❌ Permission Issues (Linux/Termux)

```bash
# Make scripts executable
chmod +x bin/redstonenode.js
chmod +x bin/redstonenode-app.js

# Fix server directory permissions
chmod -R 755 my-server-directory
```

#### ❌ Download Fails

**Check Internet Connection:**
- Ensure stable connection
- Try again - downloads auto-resume

**Manual JAR Download:**
1. Initialize server with any type
2. Download JAR manually:
   - Vanilla: [minecraft.net](https://www.minecraft.net/en-us/download/server)
   - PaperMC: [papermc.io](https://papermc.io/downloads)
   - Fabric: [fabricmc.net](https://fabricmc.net/use/server/)
3. Rename to `server.jar`
4. Place in server directory
5. Start normally

#### ❌ RedStone Command Not Found

```bash
# Reinstall globally
npm install -g redstonenode-cli

# Check installation
npm list -g redstonenode-cli

# Verify path
which redstonenode     # Linux/Termux
where.exe redstonenode # Windows
```

### 📝 Getting More Help

If issues persist:
1. Check `logs/latest.log` in server folder
2. Note exact error message
3. Check Java and Node.js versions
4. Open GitHub issue with details

## 📂 Directory Structure

```
my-server/
├── .redstone/
│   ├── config.json          # RedStone configuration
│   └── server.pid           # Process ID (when running)
├── world/                   # Default world
├── world_nether/
├── world_the_end/
├── logs/
├── plugins/                 # For Paper/Spigot
├── mods/                    # For Fabric/Forge
├── server.jar               # Server executable
├── server.properties        # Minecraft config
├── eula.txt                 # Auto-accepted
├── ops.json                 # Operators
└── whitelist.json           # Whitelist
```

## 🎯 Roadmap

- [ ] Plugin/Mod installer
- [ ] Automated backups
- [ ] Performance optimization presets
- [ ] Multi-server management
- [ ] REST API for GUI integration
- [ ] Docker support
- [ ] Web dashboard

## 🎯 Feature Highlights

### What Makes RedStone-CLI Special?

✅ **Zero Port Forwarding** - Built-in Playit.gg tunneling for instant public access  
✅ **GUI-Style Editor** - Interactive property editor with toggles and dropdowns  
✅ **Complete Player Management** - OP and whitelist management built-in  
✅ **Auto Java Detection** - Validates Java version for your MC version  
✅ **Process Cleanup** - Automatic cleanup prevents "file in use" errors  
✅ **Cross-Platform** - One CLI works on Windows, Linux, and Android  
✅ **Console Access** - Direct server console for commands and monitoring  
✅ **Beautiful UI** - Modern terminal interface with ASCII art and colors  
✅ **Auto Downloads** - Fetches server JARs automatically  
✅ **World Manager** - Multiple world support with easy switching  

### Comparison with Other Tools

| Feature | RedStone-CLI | Manual Setup | Other CLIs |
|---------|--------------|--------------|------------|
| Auto JAR Download | ✅ | ❌ | ⚠️ Some |
| Interactive Properties | ✅ | ❌ | ❌ |
| Built-in Tunneling | ✅ | ❌ | ❌ |
| OP/Whitelist GUI | ✅ | ❌ | ❌ |
| Java Version Check | ✅ | ❌ | ⚠️ Some |
| Console Access | ✅ | ✅ | ❌ |
| Cross-Platform | ✅ | ⚠️ Varies | ⚠️ Limited |
| Termux Support | ✅ | ⚠️ Complex | ❌ |

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/GopikChenth/RedStoneNode-CLI.git
cd RedStoneNode-CLI

# Install dependencies
npm install

# Link for local testing
npm link

# Test your changes
redstonenode
```

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- Use ES6+ features
- Follow existing code formatting
- Add comments for complex logic
- Test on multiple platforms if possible

### Ideas for Contributions

- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📝 Documentation updates
- 🌐 Translations/internationalization
- 🔌 Plugin/mod installer
- 📊 Server analytics dashboard
- 🔄 Backup automation
- 🐳 Docker support

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 RedStone Team

## 🔗 Links & Resources

### Official Links
- 📦 **NPM Package**: https://www.npmjs.com/package/redstonenode-cli
- 💻 **GitHub Repository**: https://github.com/GopikChenth/RedStoneNode-CLI
- 🐛 **Issue Tracker**: https://github.com/GopikChenth/RedStoneNode-CLI/issues
- 📖 **Documentation**: [View README](README.md)

### Related Resources
- 🎮 **Minecraft Official**: https://www.minecraft.net/
- 📄 **PaperMC**: https://papermc.io/
- 🧵 **Fabric**: https://fabricmc.net/
- 🔥 **Forge**: https://files.minecraftforge.net/
- 🌐 **Playit.gg**: https://playit.gg/

### Community
- 💬 **Discussions**: GitHub Discussions
- 🐦 **Updates**: Follow on Twitter
- 📧 **Contact**: Open an issue for support

## 🎉 Acknowledgments

Special thanks to:
- Node.js and npm community
- Inquirer.js for beautiful prompts
- Chalk for terminal colors
- Figlet for ASCII art
- PaperMC, Fabric, and Forge teams
- Playit.gg for tunneling service
- All contributors and users!

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/GopikChenth/RedStoneNode-CLI?style=social)
![GitHub forks](https://img.shields.io/github/forks/GopikChenth/RedStoneNode-CLI?style=social)
![npm downloads](https://img.shields.io/npm/dt/redstonenode-cli)
![GitHub issues](https://img.shields.io/github/issues/GopikChenth/RedStoneNode-CLI)

---

<div align="center">

### Made with ❤️ by the RedStone Team

**Star ⭐ this repo if you find it helpful!**

[Report Bug](https://github.com/GopikChenth/RedStoneNode-CLI/issues) · [Request Feature](https://github.com/GopikChenth/RedStoneNode-CLI/issues) · [Contribute](CONTRIBUTING.md)

</div>
