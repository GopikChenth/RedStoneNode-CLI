/**
 * RedStone CLI v2.4.5 - Main Entry Point
 * Lightweight Minecraft server manager
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { showMainMenu } = require('./cli/menu');
const packageJson = require('../package.json');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v') || args.includes('version')) {
  console.log(`RedStone CLI v${packageJson.version}`);
  process.exit(0);
}

if (args.includes('tutorial')) {
  showTutorial();
  process.exit(0);
}

// ASCII Banner
console.clear();
console.log(chalk.red(`
╦═╗╔═╗╔╦╗╔═╗╔╦╗╔═╗╔╗╔╔═╗  ╔═╗╦  ╦
╠╦╝║╣  ║║╚═╗ ║ ║ ║║║║║╣   ║  ║  ║
╩╚═╚═╝═╩╝╚═╝ ╩ ╚═╝╝╚╝╚═╝  ╚═╝╩═╝╩
`));
console.log(chalk.gray(`v${packageJson.version} - Fast & Efficient Minecraft Server Manager\n`));

// Start
showMainMenu();

function showHelp() {
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  console.log(chalk.cyan.bold('\n🎮 RedStone CLI - Minecraft Server Manager\n'));
  console.log(chalk.white('USAGE:'));
  console.log(chalk.gray('  redstone [command]\n'));
  
  console.log(chalk.white('COMMANDS:'));
  console.log(chalk.cyan('  (no args)') + chalk.gray('         Start interactive menu'));
  console.log(chalk.cyan('  help, -h, --help') + chalk.gray('  Show this help message'));
  console.log(chalk.cyan('  version, -v') + chalk.gray('        Show version number'));
  console.log(chalk.cyan('  tutorial') + chalk.gray('           Quick start tutorial\n'));
  
  console.log(chalk.white('FEATURES:'));
  console.log(chalk.gray('  • Create Vanilla, Paper, Fabric, Forge servers'));
  console.log(chalk.gray('  • Easy server management (start, stop, configure)'));
  console.log(chalk.gray('  • Built-in tunneling (Playit.gg, Bore)'));
  console.log(chalk.gray('  • World backup and restore'));
  console.log(chalk.gray('  • Server properties editor'));
  if (isTermux) {
    console.log(chalk.gray('  • Optimized for Android/Termux\n'));
  } else {
    console.log(chalk.gray('  • Cross-platform (Windows, Linux, Mac, Android)\n'));
  }
  
  console.log(chalk.white('DOCUMENTATION:'));
  console.log(chalk.gray('  GitHub: ') + chalk.cyan('https://github.com/GopikChenth/RedStoneNode-CLI'));
  console.log(chalk.gray('  NPM:    ') + chalk.cyan('https://www.npmjs.com/package/redstonenode-cli'));
  if (isTermux) {
    console.log(chalk.gray('  Termux: See TERMUX-SETUP.md in package\n'));
  } else {
    console.log(chalk.gray('  Playit: See PLAYIT-SETUP.md in package\n'));
  }
}

function showTutorial() {
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  console.log(chalk.cyan.bold('\n📚 RedStone CLI - Quick Start Tutorial\n'));
  
  console.log(chalk.green.bold('Step 1: Create Your First Server'));
  console.log(chalk.gray('  Run: ') + chalk.cyan('redstone'));
  console.log(chalk.gray('  Select: ') + chalk.white('Create'));
  console.log(chalk.gray('  Choose server type, version, and RAM\n'));
  
  console.log(chalk.green.bold('Step 2: Start the Server'));
  console.log(chalk.gray('  Select your server from the list'));
  console.log(chalk.gray('  Choose: ') + chalk.white('Start Server'));
  console.log(chalk.gray('  Wait for server to initialize\n'));
  
  console.log(chalk.green.bold('Step 3: Share with Friends'));
  if (isTermux) {
    console.log(chalk.gray('  Bore tunnel automatically starts'));
    console.log(chalk.gray('  Copy the address: ') + chalk.cyan('bore.pub:XXXXX'));
    console.log(chalk.gray('  Share with friends to join\n'));
  } else {
    console.log(chalk.gray('  Install Playit.gg for tunneling'));
    console.log(chalk.gray('  Or use Bore: ') + chalk.cyan('cargo install bore-cli'));
    console.log(chalk.gray('  Share the tunnel address\n'));
  }
  
  console.log(chalk.green.bold('Server Management:'));
  console.log(chalk.gray('  • ') + chalk.white('Server Properties') + chalk.gray(' - Configure game settings'));
  console.log(chalk.gray('  • ') + chalk.white('World Management') + chalk.gray(' - Backup/restore worlds'));
  console.log(chalk.gray('  • ') + chalk.white('Stop Server') + chalk.gray(' - Safely shutdown server'));
  console.log(chalk.gray('  • ') + chalk.white('View Logs') + chalk.gray(' - Check server output\n'));
  
  if (isTermux) {
    console.log(chalk.yellow.bold('Android/Termux Tips:'));
    console.log(chalk.gray('  • Keep Termux running with wake-lock'));
    console.log(chalk.gray('  • Use shared storage for easy file access'));
    console.log(chalk.gray('  • bore.pub may be unstable, try Playit.gg'));
    console.log(chalk.gray('  • See full guide: ') + chalk.cyan('TERMUX-SETUP.md\n'));
  } else {
    console.log(chalk.yellow.bold('Tips:'));
    console.log(chalk.gray('  • Allocate enough RAM (2GB+ recommended)'));
    console.log(chalk.gray('  • Accept EULA on first start'));
    console.log(chalk.gray('  • Use Playit.gg for reliable tunneling'));
    console.log(chalk.gray('  • Check firewall if local connection fails\n'));
  }
  
  console.log(chalk.cyan('For more help, visit: ') + chalk.white('https://github.com/GopikChenth/RedStoneNode-CLI\n'));
}
