const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

let tunnelProcess = null;

async function execute() {
  console.clear();
  
  // Show banner
  const figlet = require('figlet');
  const banner = figlet.textSync('REDSTONE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
  });
  console.log(chalk.red(banner));
  console.log(chalk.gray('                                          v1.0.0\n'));
  
  console.log(chalk.cyan('🌐 Create Public Tunnel\n'));

  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Tunnel action:',
        choices: [
          { name: '🚀 Start Playit.gg tunnel', value: 'start' },
          { name: '⏹️  Stop tunnel', value: 'stop' },
          { name: '📋 Show tunnel info', value: 'info' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    if (action === 'start') {
      await startTunnel();
    } else if (action === 'stop') {
      await stopTunnel();
    } else if (action === 'info') {
      await showTunnelInfo();
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Tunnel error:'), error.message);
  }
}

async function startTunnel() {
  const playitDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'playit');
  await fs.ensureDir(playitDir);
  
  const playitExe = path.join(playitDir, process.platform === 'win32' ? 'playit.exe' : 'playit');
  
  // Check if playit is downloaded
  if (!await fs.pathExists(playitExe)) {
    const spinner = ora('Downloading Playit.gg...').start();
    
    try {
      const downloadUrl = process.platform === 'win32'
        ? 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe'
        : 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-amd64';
      
      await downloadFile(downloadUrl, playitExe);
      
      if (process.platform !== 'win32') {
        await fs.chmod(playitExe, '755');
      }
      
      spinner.succeed(chalk.green('Playit.gg downloaded'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to download Playit.gg'));
      console.log(chalk.yellow('\n⚠️  Please download manually from: https://playit.gg/download\n'));
      return;
    }
  }

  // Check if already running
  const pidFile = path.join(playitDir, 'tunnel.pid');
  if (await fs.pathExists(pidFile)) {
    console.log(chalk.yellow('\n⚠️  Tunnel is already running!\n'));
    return;
  }

  const spinner = ora('Starting tunnel...').start();

  // Start playit process
  tunnelProcess = spawn(playitExe, [], {
    cwd: playitDir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await fs.writeFile(pidFile, tunnelProcess.pid.toString());

  let tunnelUrl = '';
  
  // Capture output to get tunnel URL
  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Look for the tunnel URL in output
    const urlMatch = output.match(/(?:https?:\/\/)?([a-z0-9-]+\.playit\.gg:\d+)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      spinner.succeed(chalk.green('Tunnel started!'));
      
      console.log(chalk.cyan('\n✅ Your public server address:\n'));
      console.log(chalk.white.bold(`  ${tunnelUrl}\n`));
      console.log(chalk.yellow('💡 Share this address with your friends!'));
      console.log(chalk.gray('📋 Keep this program running while playing.\n'));
    }
  });

  tunnelProcess.on('exit', async () => {
    await fs.remove(pidFile);
  });

  tunnelProcess.unref();

  // Wait for tunnel to establish
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  if (!tunnelUrl) {
    spinner.info(chalk.yellow('Tunnel started - check output above for your address'));
  }
}

async function stopTunnel() {
  const playitDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'playit');
  const pidFile = path.join(playitDir, 'tunnel.pid');

  if (!await fs.pathExists(pidFile)) {
    console.log(chalk.yellow('\n⚠️  No tunnel is running.\n'));
    return;
  }

  const pid = parseInt(await fs.readFile(pidFile, 'utf-8'));
  
  try {
    process.kill(pid);
    await fs.remove(pidFile);
    console.log(chalk.green('\n✅ Tunnel stopped.\n'));
  } catch (error) {
    console.log(chalk.red('\n❌ Failed to stop tunnel (process may have already exited).\n'));
    await fs.remove(pidFile);
  }
}

async function showTunnelInfo() {
  const playitDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'playit');
  const pidFile = path.join(playitDir, 'tunnel.pid');

  if (!await fs.pathExists(pidFile)) {
    console.log(chalk.yellow('\n⚠️  No tunnel is currently running.\n'));
    console.log(chalk.cyan('💡 Start a tunnel using "Start Playit.gg tunnel".\n'));
    return;
  }

  const pid = await fs.readFile(pidFile, 'utf-8');
  console.log(chalk.cyan('\n🌐 Tunnel Status:\n'));
  console.log(chalk.white(`  Status: ${chalk.green('Running')}`));
  console.log(chalk.white(`  PID: ${pid}`));
  console.log(chalk.gray('\n📋 Check the Playit.gg dashboard for your public address.\n'));
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

module.exports = { execute };
