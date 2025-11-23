# RedStone-CLI Quick Start 🚀

## Installation

```bash
cd "S:\Web Projects\RedStone-CLI"
npm install
npm link
```

## Running the CLI

Simply type in your terminal:
```bash
redstonenode
```

Or run directly:
```bash
node "S:\Web Projects\RedStone-CLI\bin\redstonenode.js"
```

## First Time Setup

1. **Run the CLI**
   ```bash
   redstonenode
   ```

2. **Select "Initialize new server"**
   - Enter server name (e.g., `my-first-server`)
   - Choose directory (press Enter for current directory)
   - Select server type (Vanilla is default)
   - Enter Minecraft version (e.g., `1.20.1`)
   - Set RAM allocation (4GB default on Windows)
   - Set port (25565 default)

3. **Wait for download**
   - The CLI will automatically download the server JAR
   - EULA will be accepted automatically

4. **Start your server**
   - Return to main menu
   - Select "Start server"
   - Choose your server
   - Server starts in background!

## Testing on Windows

```powershell
# Navigate to project
cd "S:\Web Projects\RedStone-CLI"

# Run directly
node bin/redstonenode.js

# Or after npm link
redstonenode
```

## Testing on Android (Termux)

```bash
# Install dependencies first
pkg install nodejs openjdk-17

# Clone or copy project to Termux
cd ~
git clone <your-repo>
cd redstonenode-cli

# Install and run
npm install
npm link
redstonenode
```

## Project Structure

```
RedStone-CLI/
├── bin/
│   └── redstonenode.js       # Main CLI entry point
├── src/
│   ├── commands/
│   │   ├── init.js           # Server initialization
│   │   ├── start.js          # Start server
│   │   ├── stop.js           # Stop server
│   │   ├── list.js           # List servers
│   │   ├── config.js         # Configuration
│   │   └── world.js          # World management
│   ├── utils/
│   │   ├── java-detector.js  # Java detection
│   │   └── jar-manager.js    # JAR download
│   └── index.js
├── package.json
├── README.md
├── LICENSE
└── .gitignore
```

## Common Commands

### Initialize Server
Creates a new Minecraft server with automatic setup.

### Start Server
Launches the server in the background. You can close the terminal and the server keeps running.

### Stop Server
Gracefully stops a running server.

### List Servers
Shows all servers with their status (running/stopped), type, version, and resource usage.

### Manage Worlds
- Create new worlds
- Switch between worlds
- Delete old worlds
- View world sizes

### Server Configuration
- Edit server.properties
- Manage operators (ops)
- Manage whitelist
- View RedStone config

## Tips

1. **Multiple Servers**: You can create multiple server directories, each with its own configuration.

2. **Background Running**: Servers run in the background. Use "Stop server" to shut them down properly.

3. **Port Conflicts**: If you run multiple servers, make sure each uses a different port.

4. **RAM Allocation**: Adjust based on your system. Android devices typically need less RAM (3GB).

5. **Java Version**: Modern Minecraft versions (1.18+) require Java 17 or higher.

## Troubleshooting

### "Java not found"
- **Windows**: Download from https://adoptium.net/ and install
- **Termux**: Run `pkg install openjdk-17`
- **Linux**: Run `sudo apt install openjdk-17-jdk`

### "Command not found: redstonenode"
```bash
npm link
```

### Server won't start
1. Check if Java is installed: `java -version`
2. Check if port is available
3. Check logs in server directory: `logs/latest.log`

### Permission denied (Linux/Termux)
```bash
chmod +x bin/redstonenode.js
```

## Next Steps

1. ✅ Test initialization
2. ✅ Test server start/stop
3. ✅ Test world management
4. ✅ Configure server properties
5. ✅ Add operators and whitelist
6. 🚀 Play Minecraft!

---

**Need help?** Check the full [README.md](README.md) for detailed documentation.
