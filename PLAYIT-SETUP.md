# 🌐 Playit.gg Setup Guide

## What is Playit.gg?

Playit.gg is a free tunneling service that creates a public address for your Minecraft server, allowing friends from anywhere to connect without port forwarding.

---

## 📋 Quick Setup (Automatic)

RedStone CLI handles most of the setup automatically:

1. **Start your server with tunnel:**
   ```bash
   redstone
   ```
   - Select "List servers"
   - Choose your server
   - Select "Start Server"
   - Choose "Yes" when asked about Playit.gg tunnel

2. **First-time setup:**
   - Playit will download automatically (~10-15MB)
   - A claim URL will appear: `https://playit.gg/claim/XXXXX`
   - Visit this URL in your browser
   - Sign in (or create free account)
   - Click "Claim Agent"

3. **After claiming:**
   - Restart your server
   - The public address will appear automatically
   - Example: `auto.playit.gg:12345`

---

## 🎮 Using Your Public Address

### Share with Friends:
```
Server Address: auto.playit.gg:12345
```

### For You (Same PC):
```
Server Address: localhost:25565
```

---

## ⚙️ Manual Setup (Advanced)

If you need to configure Playit manually:

### Windows:
1. The Playit executable is at: `C:\Users\YourName\.redstone\playit\playit-windows.exe`
2. Run it: Opens a console window
3. Follow the claim instructions
4. Configure tunnel:
   - Protocol: TCP
   - Local Port: 25565
   - Game: Minecraft

### Linux/Termux:
1. The Playit executable is at: `~/.redstone/playit/playit-linux-*`
2. Run: `~/.redstone/playit/playit-linux-amd64`
3. Follow the claim instructions
4. Configure tunnel for port 25565

---

## 🔧 Troubleshooting

### "Tunnel URL pending"
- **Wait 20-30 seconds** - Playit takes time to connect
- Check the Playit console window for the address
- Visit: https://playit.gg/account/agents
- Look for your agent and the assigned address

### "Claim URL" appears every time
- You haven't claimed the agent yet
- Visit the claim URL and sign in
- Make sure to click "Claim Agent"

### Address keeps changing
- Free Playit addresses can change
- Upgrade to Playit+ for permanent addresses
- Or re-share the new address with friends

### Can't connect to public address
- **Firewall**: Make sure Java is allowed
- **Server starting**: Wait for "Done!" message in console
- **Wrong address**: Double-check the exact address (case-sensitive)
- **Server offline**: Make sure the server is still running

### Friends can't connect
- Share the **exact** Playit address (e.g., `auto.playit.gg:12345`)
- Don't share `localhost` - that only works on your PC
- Make sure they're using Java Edition (not Bedrock)
- Verify server version matches their Minecraft version

---

## 💡 Tips

✅ **Keep the Playit window open** - Closing it stops the tunnel

✅ **Save your address** - Write it down for next time

✅ **Whitelist recommended** - Add to `server.properties`:
```properties
white-list=true
```
Then use RedStone CLI to add players

✅ **Check your dashboard** - https://playit.gg/account/agents shows all active tunnels

---

## 🆓 Free vs Playit+

### Free (Current):
- ✅ Unlimited bandwidth
- ✅ No time limits
- ⚠️ Address may change
- ⚠️ Shared IP pool

### Playit+ ($5/month):
- ✅ Everything in Free
- ✅ **Permanent address** (never changes)
- ✅ Custom domains (play.yourname.com)
- ✅ Priority support

**For casual play with friends, Free is perfect!**

---

## 🔗 Useful Links

- **Playit Dashboard**: https://playit.gg/account/agents
- **Playit Docs**: https://playit.gg/docs
- **Playit Support**: https://discord.gg/playit

---

## 📞 Need Help?

If you're still having issues:

1. **Check the Playit console window** - Look for error messages
2. **Visit Playit dashboard** - https://playit.gg/account/agents
3. **Restart everything**:
   ```bash
   # Close server and Playit windows
   # Then start fresh
   redstone
   ```

4. **Manual verification**:
   - Server running? (Check console for "Done!")
   - Playit running? (Check dashboard shows "Online")
   - Correct address? (Copy from dashboard or console)

---

## 🎯 Quick Reference

| Scenario | Address to Use |
|----------|---------------|
| Playing on same PC | `localhost:25565` |
| Playing on same WiFi | `192.168.x.x:25565` |
| Friends anywhere online | `auto.playit.gg:12345` |

**Always share the Playit address for online friends!**
