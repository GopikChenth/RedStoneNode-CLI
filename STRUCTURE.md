# RedStoneNode CLI - Page Structure

📱 MAIN MENU (src/index.js)
├── Create new server
├── List servers
├── Tunneling Option
├── Configuration
└── Exit

📋 SERVER LIST PAGE (src/commands/list.js → execute())
├── Shows table: Name | Type | Version | Status | Port | RAM
└── Select server → SERVER MENU

🔧 SERVER MENU (showServerMenu())
├── Start (if stopped)
├── Stop (if running)
├── View Logs (if running)
├── World
├── Server properties
├── Files
├── 🗑️ Delete Server
└── Back

🔧 Tunneling Option
├── Playit.gg (Default)
├── Ngrok
├── LocalTunnel
├── Bore
└── Cloudflared

📊 SERVER RUNNING PAGE (showServerRunningPage())
├── Server Info Box
│   ├── Name
│   ├── Type & Version
│   ├── Port
│   ├── RAM
│   ├── Status: Running
│   └── Tunnel URL (if enabled)
├── Actions:
│   ├── View Logs
│   ├── Stop Server
│   └── Back

⚙️ SERVER PROPERTIES PAGE (manageProperties())
├── Max Players
├── Gamemode (survival/creative/adventure/spectator)
├── Difficulty (peaceful/easy/normal/hard)
├── Enable whitelist
├── PVP
├── Online mode
├── Spawn protection
├── View distance
├── Max world size
├── Enable command block
├── Spawn animals
├── Spawn monsters
├── OP List →
├── Whitelist →
└── Back

👑 OP LIST PAGE (manageOPList())
├── Shows table: Username | Level | Bypass
├── Add new OP
├── Remove OP
└── Back

📝 WHITELIST PAGE (manageWhitelistList())
├── Shows table: Username | UUID
├── Add player
├── Remove player
└── Back

🌍 WORLD MENU (src/commands/world.js)
├── Import world
├── Export world
├── Backup world
├── Restore backup
└── Back

📁 FILES PAGE (openFileManager())
├── Opens system file manager
└── Returns to menu

📜 CONSOLE/LOGS PAGE (showConsole())
├── Displays latest.log
├── Real-time updates
└── ESC to return
