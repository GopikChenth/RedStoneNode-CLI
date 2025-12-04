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

## Usage

```bash
redstone
```

## Important Notes

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
Grant storage permissions to access custom directories:
```bash
termux-setup-storage
```

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
# Install Rust (if not installed)
pkg install rust

# Install Bore
cargo install bore-cli

# Bore will be used automatically when starting servers
```

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

### Out of Memory errors
Reduce RAM allocation in server configuration. Termux has memory limits.

### Port already in use
Check if another server is running:
```bash
ps aux | grep java
# Kill if needed: kill <pid>
```

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
