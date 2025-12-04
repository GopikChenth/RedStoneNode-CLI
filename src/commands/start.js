/**
 * Start Command - Launch server with optional tunnel
 */

const inquirer = require('inquirer');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { getServersDir } = require('./list');

async function startServer() {
  const serversDir = getServersDir();
  await fs.ensureDir(serversDir);
  
  let servers = [];
  try {
    const items = await fs.readdir(serversDir);
    for (const item of items) {
      const itemPath = path.join(serversDir, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        servers.push(item);
      }
    }
  } catch (error) {
    servers = [];
  }

  if (servers.length === 0) {
    console.log(chalk.yellow('\n📁 No servers found. Create one first!\n'));
    return;
  }

  // Select server
  const { serverName } = await inquirer.prompt([{
    type: 'list',
    name: 'serverName',
    message: 'Select server:',
    choices: servers
  }]);

  const serverPath = path.join(serversDir, serverName);
  const config = await fs.readJson(path.join(serverPath, 'redstone.json'));

  // Ask about tunnel
  const { useTunnel } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useTunnel',
    message: 'Start with tunnel (Playit.gg)?',
    default: true
  }]);

  console.log(chalk.cyan(`\n🚀 Starting ${serverName}...\n`));

  // Start tunnel first if needed
  let tunnelUrl = null;
  if (useTunnel) {
    tunnelUrl = await startTunnel(serverPath);
  }

  // Start Minecraft server
  await launchMinecraft(serverPath, config, tunnelUrl);
}

async function startTunnel(serverPath) {
  const spinner = ora('Starting Playit.gg tunnel...').start();

  try {
    // Download playit if not exists
    const playitPath = await ensurePlayit();

    // Start playit in background
    const playit = spawn(playitPath, [], {
      cwd: serverPath,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for tunnel URL
    return new Promise((resolve) => {
      let output = '';
      
      playit.stdout.on('data', (data) => {
        output += data.toString();
        
        // Extract tunnel URL (playit format)
        const match = output.match(/https?:\/\/[^\s]+/);
        if (match) {
          spinner.succeed(`Tunnel active: ${match[0]}`);
          resolve(match[0]);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        spinner.warn('Tunnel URL not captured, but may be running');
        resolve('Check Playit dashboard');
      }, 10000);
    });
  } catch (error) {
    spinner.fail('Tunnel failed');
    console.log(chalk.yellow('⚠️  Continuing without tunnel\n'));
    return null;
  }
}

async function launchMinecraft(serverPath, config, tunnelUrl) {
  console.log(chalk.green('╔════════════════════════════════════════╗'));
  console.log(chalk.green('║         SERVER STARTING...             ║'));
  console.log(chalk.green('╚════════════════════════════════════════╝'));
  console.log('');
  
  if (tunnelUrl) {
    console.log(chalk.cyan(`🌐 Public URL: ${tunnelUrl}`));
  }
  console.log(chalk.gray(`📁 Location: ${serverPath}`));
  console.log('');
  console.log(chalk.yellow('Press Ctrl+C to stop server'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // Detect Java
  const javaCmd = process.platform === 'win32' ? 'java.exe' : 'java';

  // Start server
  const server = spawn(javaCmd, [
    `-Xmx${config.ram}M`,
    `-Xms${Math.floor(config.ram / 2)}M`,
    '-jar',
    'server.jar',
    'nogui'
  ], {
    cwd: serverPath,
    stdio: 'inherit'
  });

  server.on('close', (code) => {
    console.log(chalk.yellow(`\n\n🛑 Server stopped (exit code: ${code})\n`));
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⏹️  Stopping server...\n'));
    server.kill();
    process.exit(0);
  });
}

async function ensurePlayit() {
  const os = require('os');
  const platform = os.platform();
  const arch = os.arch();
  
  const playitDir = path.join(os.homedir(), '.redstone', 'playit');
  await fs.ensureDir(playitDir);

  let filename;
  if (platform === 'win32') {
    filename = 'playit.exe';
  } else if (platform === 'linux' && arch === 'arm64') {
    filename = 'playit-linux-aarch64';
  } else {
    filename = 'playit-linux-amd64';
  }

  const playitPath = path.join(playitDir, filename);

  // Download if not exists
  if (!await fs.pathExists(playitPath)) {
    const spinner = ora('Downloading Playit.gg...').start();
    
    const axios = require('axios');
    const url = `https://playit.gg/downloads/${filename}`;
    
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(playitPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Make executable on Unix
    if (platform !== 'win32') {
      await fs.chmod(playitPath, '755');
    }

    spinner.succeed('Playit.gg downloaded');
  }

  return playitPath;
}

module.exports = { startServer };
