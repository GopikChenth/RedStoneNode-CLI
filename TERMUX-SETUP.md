# Termux/Android Setup Guide

## Prerequisites

Before using RedStone CLI on Termux, you need to install the required packages:

```bash
# Update package list
pkg update && pkg upgrade

# Install required packages
pkg install nodejs openjdk-17 wget

# Optional: For wake-lock support (prevents device sleep)
pkg install termux-api
```

## Installation

```bash
npm install -g redstonenode-cli
```

## First-Time Setup (Important!)

**Before creating servers, grant storage permissions:**
```bash
termux-setup-storage
```

This allows:
- ✅ Servers to be created in `/storage/emulated/0/Documents/` (easy file manager access)
- ✅ Accessing server files with any file manager app
- ✅ No need for special URIs or complex paths

## Usage

```bash
redstone
```

## Important Notes

### 0. Accessing Server Files
**Default Location (Recommended):**
- **Shared Storage**: `/storage/emulated/0/Documents/RedStone-Servers/` ✅ Easy access!
- You can browse this folder with any file manager app
- No need for special URIs or permissions

**Alternative Locations:**
- **Termux Home**: `/data/data/com.termux/files/home/.redstone/servers/`
- **Termux Home URI**: `content://com.termux.documents/tree/%2Fdata%2Fdata%2Fcom.termux%2Ffiles%2Fhome`
- Run `termux-setup-storage` to grant file manager access

**From Termux:**
```bash
# Open server folder in file manager
termux-open ~/.redstone/servers/my-server

# Or navigate manually
cd ~/.redstone/servers/my-server
```

**From RedStone CLI:**
```bash
redstone
# Select server → "📁 Open Files"
```

### 1. Keep Termux Running
- Keep the Termux app open in the background
- The server will stop if you force-close Termux
- Use split-screen or picture-in-picture mode if available

### 2. Wake Lock (Recommended)
Install Termux:API from F-Droid to prevent your device from sleeping:
```bash
pkg install termux-api
```

Download Termux:API app from F-Droid: https://f-droid.org/packages/com.termux.api/

### 3. Storage Access
Grant storage permissions to access custom directories and use file managers:
```bash
termux-setup-storage
```

After running this, you can:
- Access Termux files in your file manager
- Create servers in `/storage/emulated/0/` (internal storage)
- Use `termux-open` command to open folders

### 4. Battery Optimization
- Disable battery optimization for Termux in Android settings
- This prevents Android from killing the app in the background

### 5. RAM Recommendations
- **1GB device**: Use 512MB max for server
- **2GB device**: Use 1024MB max for server  
- **3GB+ device**: Use 1536-2048MB for server

Leave at least 512MB for Android system!

## Tunneling on Termux

### Bore (Recommended for Termux)
Bore is automatically used as the default tunnel on Termux:

```bash
# 1. Install Rust (if not installed)
pkg install rust -y

# 2. Install Bore (takes 5-10 minutes to compile)
cargo install bore-cli

# 3. Add to PATH (add this to ~/.bashrc for permanent)
export PATH=$HOME/.cargo/bin:$PATH

# 4. Verify installation
bore --version

# Bore will be used automatically when starting servers
```

**Note**: Bore compilation requires ~500MB free RAM. If it fails, close other apps and try again.

### Playit.gg (Alternative)
Playit.gg also works on Termux but requires more setup.

## Troubleshooting

### "Java not found"
```bash
pkg install openjdk-17
```

### "Cannot find module 'inquirer'"
```bash
npm install -g redstonenode-cli --force
```

### Server stops when screen locks
- Install termux-api package
- Disable battery optimization for Termux
- Keep Termux in foreground or use split-screen

### JNA/udev library warnings
You may see warnings like:
```
[WARN]: Did not find udev library in operating system
[WARN]: Failed retrieving info for group processor
```

**These are safe to ignore!** They're just warnings about native libraries not available on Android. The server will work fine.

### Out of Memory errors
Reduce RAM allocation in server configuration. Termux has memory limits.

### Cannot find server files
Your servers are stored in: `~/.redstone/servers/`

**Option 1: Using File Manager (Recommended)**

Method 1 - Document Provider URI (Android file pickers):
```
content://com.termux.documents/tree/%2Fdata%2Fdata%2Fcom.termux%2Ffiles%2Fhome
```

Method 2 - Direct filesystem path:
1. Open any file manager app (Files, Solid Explorer, MiXplorer, etc.)
2. Navigate to: `/data/data/com.termux/files/home/.redstone/servers/`
3. Full server path: `/data/data/com.termux/files/home/.redstone/servers/my-server/`

**Option 2: Using Termux Commands**
```bash
# List all servers
ls ~/.redstone/servers/

# Go to your server directory
cd ~/.redstone/servers/my-server

# View files
ls -la

# Open in file manager from Termux
termux-open ~/.redstone/servers/my-server
```

**Option 3: Use "Open Files" in RedStone CLI**
```bash
redstone
# Select your server → Choose "📁 Open Files"
# It will automatically open the folder or show the path
```

**Tip**: Grant storage permissions for better file manager access:
```bash
termux-setup-storage
```

If you chose a custom location during creation (like `/storage/emulated/0/`), check the path shown when the server was created.

### Port already in use (Address already in use)
This means another Minecraft server is already running on port 25565.

**Fix:**
```bash
# Find the Java process
ps aux | grep java

# Kill the process (replace <PID> with the actual number)
kill <PID>

# Or kill all Java processes
pkill -9 java

# Then start your server again
```

**Prevention:**
- Always use "⏹️ Stop Server" before starting a new one
- Check running servers with: `ps aux | grep java`

## Performance Tips

1. **Use Paper**: Paper servers are more efficient than Vanilla
2. **Reduce RAM**: Don't allocate more than 60% of available RAM
3. **Limit View Distance**: Edit server.properties to set view-distance=6 or lower
4. **Reduce Max Players**: Lower max-players to 5-10 for better performance
5. **Use Aikar's Flags**: Optimize Java garbage collection (advanced users)

## Supported Devices

- **Android 7.0+** recommended
- **2GB+ RAM** for smooth operation
- **ARMv8 (64-bit)** processor recommended
- **4GB+ storage** free space

## Known Limitations

- Cannot run servers in true background (Termux must stay open)
- Higher battery drain than native apps
- Performance depends heavily on device specs
- Some plugins may not work on ARM architecture

## Need Help?

- GitHub Issues: https://github.com/GopikChenth/RedStoneNode-CLI/issues
- Discord: [Coming Soon]
