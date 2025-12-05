/**
 * Main Menu - Follows STRUCTURE.md
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { showServerList } = require('../commands/list');
const { createServer } = require('../commands/create');

async function showMainMenu() {
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  console.log(''); // spacing
  
  // Platform-specific welcome banner
  if (isTermux) {
    // Mobile/Termux - compact banner (46 chars)
    console.log(chalk.cyan('╔════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.green.bold('       📱 RedStone Mobile v2.4.4         ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════╝'));
  } else {
    // PC - full banner (44 chars content)
    console.log(chalk.cyan('╔════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.green.bold('       🎮 RedStone CLI v2.4.2            ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('    Minecraft Server Management Tool    ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════╝'));
  }
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: isTermux ? 'Menu' : 'Main Menu',
    choices: isTermux ? [
      // Mobile - simplified menu
      { name: '➕ Create', value: 'create' },
      { name: '📋 Servers', value: 'list' },
      { name: '❌ Exit', value: 'exit' }
    ] : [
      // PC - full menu
      { name: '➕ Create new server', value: 'create' },
      { name: '📋 List servers', value: 'list' },
      { name: '🌐 Tunneling Option', value: 'tunnel' },
      { name: '⚙️  Configuration', value: 'config' },
      { name: '❌ Exit', value: 'exit' }
    ]
  }]);

  switch (action) {
    case 'create':
      await createServer();
      break;
    case 'list':
      await showServerList();
      break;
    case 'tunnel':
      await showTunnelingOptions();
      break;
    case 'config':
      await showConfiguration();
      break;
    case 'exit':
      console.log(chalk.green('\n👋 Goodbye!\n'));
      process.exit(0);
  }

  // Loop back to menu
  await showMainMenu();
}

async function showTunnelingOptions() {
  const platform = process.platform;
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  console.log(chalk.cyan('\n🌐 Tunneling Options\n'));
  
  // Show platform-specific recommendation
  if (platform === 'win32') {
    console.log(chalk.gray('💡 Recommended for Windows: ') + chalk.green('Playit.gg'));
    console.log(chalk.gray('   • Free forever, no time limits'));
    console.log(chalk.gray('   • Easy setup, reliable connection'));
    console.log(chalk.gray('   • Custom domains available\n'));
  } else if (isTermux) {
    console.log(chalk.gray('💡 Recommended for Termux/Android: ') + chalk.green('Bore'));
    console.log(chalk.gray('   • Lightweight and fast'));
    console.log(chalk.gray('   • Works on limited resources'));
    console.log(chalk.gray('   • No account needed\n'));
  } else {
    console.log(chalk.gray('💡 Recommended for Linux: ') + chalk.green('Bore or Playit.gg'));
    console.log(chalk.gray('   • Both work great on Linux'));
    console.log(chalk.gray('   • Playit: More features, requires account'));
    console.log(chalk.gray('   • Bore: Simpler, no account needed\n'));
  }
  
  const { tunnel } = await inquirer.prompt([{
    type: 'list',
    name: 'tunnel',
    message: 'Learn about tunnel services:',
    choices: [
      { name: '🎮 Playit.gg (Windows Recommended)', value: 'playit' },
      { name: '🔧 Bore (Linux/Android Recommended)', value: 'bore' },
      { name: '🌐 LocalTunnel', value: 'localtunnel' },
      { name: '⬅️  Back', value: 'back' }
    ]
  }]);

  if (tunnel === 'back') return;
  
  // Show info about selected tunnel
  switch (tunnel) {
    case 'playit':
      console.log(chalk.cyan('\n🎮 PLAYIT.GG\n'));
      console.log(chalk.white('Features:'));
      console.log(chalk.gray('  ✅ Free forever, unlimited bandwidth'));
      console.log(chalk.gray('  ✅ Reliable addresses (e.g., game-name.gl.joinmc.link)'));
      console.log(chalk.gray('  ✅ Dashboard to manage tunnels'));
      console.log(chalk.gray('  ✅ Custom domains (paid)'));
      console.log(chalk.gray('  ⚠️  Requires account (free sign-up)'));
      console.log(chalk.gray('\nWebsite: ') + chalk.cyan('https://playit.gg'));
      break;
      
    case 'bore':
      console.log(chalk.cyan('\n🔧 BORE\n'));
      console.log(chalk.white('Features:'));
      console.log(chalk.gray('  ✅ No account needed'));
      console.log(chalk.gray('  ✅ Lightweight and fast'));
      console.log(chalk.gray('  ✅ Open source'));
      console.log(chalk.gray('  ⚠️  Addresses change each time (e.g., bore.pub:54321)'));
      console.log(chalk.gray('  ⚠️  bore.pub can be unreliable'));
      console.log(chalk.gray('\nInstall: ') + chalk.cyan('cargo install bore-cli'));
      console.log(chalk.gray('GitHub: ') + chalk.cyan('https://github.com/ekzhang/bore'));
      break;
      
    case 'localtunnel':
      console.log(chalk.cyan('\n🌐 LOCALTUNNEL\n'));
      console.log(chalk.white('Features:'));
      console.log(chalk.gray('  ✅ No account needed'));
      console.log(chalk.gray('  ✅ Easy to use'));
      console.log(chalk.gray('  ⚠️  Can be slower'));
      console.log(chalk.gray('  ⚠️  Less reliable for Minecraft'));
      console.log(chalk.gray('\nWebsite: ') + chalk.cyan('https://localtunnel.me'));
      break;
  }
  
  console.log(chalk.gray('\n💡 Tunnel is selected automatically when you start a server.\n'));
}

async function showConfiguration() {
  console.log(chalk.cyan('\n⚙️  Configuration\n'));
  console.log(chalk.gray('Configuration options coming soon...\n'));
}

module.exports = { showMainMenu };
