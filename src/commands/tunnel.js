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
  
  console.log(chalk.cyan('🌐 Set Default Tunneling Service\n'));
  console.log(chalk.gray('Select the default tunnel service for all servers:\n'));
  console.log(chalk.white('  🚀 Bore         - Cross-platform, automated (RECOMMENDED)'));
  console.log(chalk.white('  🎮 Playit.gg    - Windows/Linux only, automated'));
  console.log(chalk.white('  ☁️  Cloudflared - Windows/Linux, automated'));
  console.log(chalk.white('  🌍 Ngrok        - Manual setup required'));
  console.log(chalk.white('  📡 LocalTunnel  - HTTP only (not compatible)\n'));

  try {
    // Get current default
    const configDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone');
    await fs.ensureDir(configDir);
    const configFile = path.join(configDir, 'tunnel-config.json');
    
    let currentDefault = 'bore';
    if (await fs.pathExists(configFile)) {
      const config = await fs.readJson(configFile);
      currentDefault = config.defaultService || 'bore';
    }
    
    console.log(chalk.yellow(`Current default: ${currentDefault}\n`));

    const { tunnelService } = await inquirer.prompt([
      {
        type: 'list',
        name: 'tunnelService',
        message: 'Select default tunnel service:',
        default: currentDefault,
        choices: [
          { name: '🚀 Bore (Recommended - Works everywhere)', value: 'bore' },
          { name: '🎮 Playit.gg (Windows/Linux only)', value: 'playit' },
          { name: '☁️  Cloudflared (Windows/Linux)', value: 'cloudflared' },
          { name: '🌍 Ngrok (Manual setup)', value: 'ngrok' },
          { name: '📡 LocalTunnel (Not compatible)', value: 'localtunnel' },
          new inquirer.Separator(),
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (tunnelService === 'back') return;

    // Save the default
    await fs.writeJson(configFile, { defaultService: tunnelService }, { spaces: 2 });
    
    console.log(chalk.green(`\n✅ Default tunnel service set to: ${tunnelService}`));
    console.log(chalk.gray('\nThis will be used automatically when starting servers with tunneling enabled.\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Tunnel error:'), error.message);
  }
}

async function getDefaultTunnelService() {
  try {
    const configDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone');
    const configFile = path.join(configDir, 'tunnel-config.json');
    
    if (await fs.pathExists(configFile)) {
      const config = await fs.readJson(configFile);
      return config.defaultService || 'bore';
    }
  } catch (error) {
    // Return default if config doesn't exist
  }
  return 'bore';
}

async function startTunnel(service = 'playit', port = 25565, autoStart = true) {
  if (service === 'ngrok') {
    return await startNgrok(port, autoStart);
  } else if (service === 'localtunnel') {
    return await startLocalTunnel(port, autoStart);
  } else if (service === 'bore') {
    return await startBore(port, autoStart);
  } else if (service === 'cloudflared') {
    return await startCloudflared(port, autoStart);
  } else {
    return await startPlayit();
  }
}

async function startPlayit() {
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

async function startNgrok(port = 25565, autoStart = false) {
  console.log(chalk.yellow('\n⚠️  Ngrok requires manual setup\n'));
  console.log(chalk.red('🐞 The ngrok npm package has reliability issues with process management.\n'));
  console.log(chalk.cyan('Manual setup (recommended):\n'));
  console.log(chalk.white('1. Download ngrok: https://ngrok.com/download'));
  console.log(chalk.white('2. Sign up for free: https://dashboard.ngrok.com/signup'));
  console.log(chalk.white('3. Get your auth token: https://dashboard.ngrok.com/get-started/your-authtoken'));
  console.log(chalk.white('4. Configure: ngrok config add-authtoken YOUR_TOKEN'));
  console.log(chalk.white(`5. Run in separate terminal: ngrok tcp ${port}\n`));
  console.log(chalk.gray('📋 Then copy the TCP address shown (e.g., 0.tcp.ngrok.io:12345)\n'));
  
  if (autoStart) {
    console.log(chalk.green('💡 Tip: Use Playit.gg instead for fully automated tunneling!\n'));
    console.log(chalk.gray('   Change in: Main Menu → Tunneling Option → Playit.gg\n'));
  }
  
  return null;
}

async function startLocalTunnel(port = 25565, autoStart = false) {
  console.log(chalk.yellow('\n⚠️  LocalTunnel only supports HTTP/HTTPS, not TCP (Minecraft)\n'));
  console.log(chalk.red('❌ LocalTunnel is not compatible with Minecraft servers\n'));
  console.log(chalk.cyan('💡 Please use one of these instead:\n'));
  console.log(chalk.white('  • Playit.gg (Recommended)'));
  console.log(chalk.white('  • Ngrok'));
  console.log(chalk.white('  • Bore'));
  console.log(chalk.white('  • Cloudflared\n'));
  
  return null;
}

async function startBore(port = 25565, autoStart = false) {
  const { execSync } = require('child_process');
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  const isAndroid = process.platform === 'android' || isTermux;
  
  const boreDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'bore');
  await fs.ensureDir(boreDir);
  
  let boreExe;
  let boreCommand;
  let boreAvailable = false;
  
  // Determine platform and check for bore
  if (isAndroid) {
    // Try Termux package manager first
    try {
      execSync('which bore', { stdio: 'ignore' });
      boreCommand = 'bore';
      boreAvailable = true;
    } catch {
      // Try to install via pkg
      console.log(chalk.yellow('\n⚠️  Bore not installed in Termux\n'));
      console.log(chalk.cyan('Installing bore via Termux pkg...\n'));
      
      const spinner = ora('Installing bore...').start();
      try {
        // Install rust and cargo if not present
        try {
          execSync('which cargo', { stdio: 'ignore' });
        } catch {
          spinner.text = 'Installing rust and cargo...';
          execSync('pkg install rust -y', { stdio: 'inherit' });
        }
        
        spinner.text = 'Installing bore-cli...';
        execSync('cargo install bore-cli', { stdio: 'inherit' });
        
        spinner.succeed(chalk.green('Bore installed!'));
        boreCommand = 'bore';
        boreAvailable = true;
      } catch (error) {
        spinner.fail(chalk.red('Failed to install bore'));
        console.log(chalk.yellow('\n💡 Manual installation:\n'));
        console.log(chalk.white('  pkg install rust -y'));
        console.log(chalk.white('  cargo install bore-cli\n'));
        return null;
      }
    }
  } else if (process.platform === 'win32') {
    boreExe = path.join(boreDir, 'bore.exe');
    
    if (await fs.pathExists(boreExe)) {
      boreCommand = boreExe;
      boreAvailable = true;
    } else {
      const spinner = ora('Downloading bore for Windows...').start();
      try {
        const downloadUrl = 'https://github.com/ekzhang/bore/releases/download/v0.5.1/bore-v0.5.1-x86_64-pc-windows-msvc.exe';
        await downloadFile(downloadUrl, boreExe);
        spinner.succeed(chalk.green('Bore downloaded'));
        boreCommand = boreExe;
        boreAvailable = true;
      } catch (error) {
        spinner.fail(chalk.red('Failed to download bore'));
        console.log(chalk.yellow('\n⚠️  Please install bore manually:\n'));
        console.log(chalk.white('  Download from: https://github.com/ekzhang/bore/releases\n'));
        return null;
      }
    }
  } else {
    // Linux
    try {
      execSync('bore --version', { stdio: 'ignore' });
      boreCommand = 'bore';
      boreAvailable = true;
    } catch {
      console.log(chalk.red('\n❌ Bore not installed!\n'));
      console.log(chalk.cyan('Install bore:\n'));
      console.log(chalk.white('  cargo install bore-cli'));
      console.log(chalk.white('  OR download from: https://github.com/ekzhang/bore/releases\n'));
      return null;
    }
  }
  
  if (!boreAvailable) return null;
  
  const spinner = ora('Starting bore tunnel...').start();
  
  // Start bore process
  const boreProcess = spawn(boreCommand, 
    ['local', port.toString(), '--to', 'bore.pub'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isAndroid // Use shell on Android for better PATH resolution
    }
  );
  
  let tunnelUrl = '';
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (!tunnelUrl) {
        spinner.fail(chalk.red('Timed out waiting for bore tunnel'));
        boreProcess.kill();
        resolve(null);
      }
    }, 15000);
    
    boreProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Look for the tunnel URL (format: listening at bore.pub:xxxxx)
      const urlMatch = output.match(/listening at (bore\.pub:\d+)/i);
      if (urlMatch) {
        tunnelUrl = urlMatch[1];
        clearTimeout(timeout);
        spinner.succeed(chalk.green('Bore tunnel started!'));
        
        console.log(chalk.cyan('\n✅ Your public server address:\n'));
        console.log(chalk.white.bold(`  ${tunnelUrl}\n`));
        console.log(chalk.yellow('💡 Share this address with your friends!'));
        console.log(chalk.gray('📋 Keep this program running while playing.\n'));
        
        resolve(tunnelUrl);
      }
    });
    
    boreProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('listening at')) {
        const urlMatch = output.match(/listening at (bore\.pub:\d+)/i);
        if (urlMatch) {
          tunnelUrl = urlMatch[1];
          clearTimeout(timeout);
          spinner.succeed(chalk.green('Bore tunnel started!'));
          
          console.log(chalk.cyan('\n✅ Your public server address:\n'));
          console.log(chalk.white.bold(`  ${tunnelUrl}\n`));
          console.log(chalk.yellow('💡 Share this address with your friends!'));
          console.log(chalk.gray('📋 Keep this program running while playing.\n'));
          
          resolve(tunnelUrl);
        }
      }
    });
    
    boreProcess.on('error', (error) => {
      clearTimeout(timeout);
      spinner.fail(chalk.red('Failed to start bore'));
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
      resolve(null);
    });
    
    boreProcess.on('exit', (code) => {
      if (code !== 0 && !tunnelUrl) {
        clearTimeout(timeout);
        spinner.fail(chalk.red('Bore process exited'));
        resolve(null);
      }
    });
    
    // Keep process alive
    boreProcess.unref();
  });
}

async function startCloudflared(port = 25565, autoStart = false) {
  const cfDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'cloudflared');
  await fs.ensureDir(cfDir);
  
  let cfExe;
  
  if (process.platform === 'win32') {
    cfExe = path.join(cfDir, 'cloudflared.exe');
  } else {
    cfExe = 'cloudflared'; // Try system cloudflared first
  }
  
  // Check if cloudflared is available
  const { execSync } = require('child_process');
  let cfAvailable = false;
  
  try {
    if (process.platform === 'win32' && await fs.pathExists(cfExe)) {
      cfAvailable = true;
    } else {
      execSync('cloudflared version', { stdio: 'ignore' });
      cfAvailable = true;
    }
  } catch {
    // Try to download for Windows
    if (process.platform === 'win32') {
      const spinner = ora('Downloading cloudflared...').start();
      try {
        const downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
        await downloadFile(downloadUrl, cfExe);
        spinner.succeed(chalk.green('Cloudflared downloaded'));
        cfAvailable = true;
      } catch (error) {
        spinner.fail(chalk.red('Failed to download cloudflared'));
        console.log(chalk.yellow('\n⚠️  Please install cloudflared manually:\n'));
        console.log(chalk.white('  Download from: https://github.com/cloudflare/cloudflared/releases\n'));
        return null;
      }
    } else {
      console.log(chalk.red('\n❌ Cloudflared not installed!\n'));
      console.log(chalk.cyan('Install cloudflared:\n'));
      console.log(chalk.white('  Linux: wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'));
      console.log(chalk.white('  Termux: pkg install cloudflared\n'));
      return null;
    }
  }
  
  if (!cfAvailable) return null;
  
  const spinner = ora('Starting cloudflared tunnel...').start();
  
  // Start cloudflared process
  const cfProcess = spawn(process.platform === 'win32' ? cfExe : 'cloudflared',
    ['tunnel', '--url', `tcp://localhost:${port}`],
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  
  let tunnelUrl = '';
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (!tunnelUrl) {
        spinner.fail(chalk.red('Timed out waiting for cloudflared tunnel'));
        cfProcess.kill();
        resolve(null);
      }
    }, 20000);
    
    cfProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output); // Show cloudflared output
      
      // Look for the tunnel URL
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (urlMatch) {
        tunnelUrl = urlMatch[0];
        clearTimeout(timeout);
        spinner.succeed(chalk.green('Cloudflared tunnel started!'));
        
        console.log(chalk.cyan('\n✅ Your public server address:\n'));
        console.log(chalk.white.bold(`  ${tunnelUrl}\n`));
        console.log(chalk.yellow('💡 Share this address with your friends!'));
        console.log(chalk.gray('📋 Keep this program running while playing.\n'));
        console.log(chalk.red('⚠️  Note: Cloudflare may show HTTPS URL, but Minecraft connects via TCP\n'));
        
        resolve(tunnelUrl);
      }
    });
    
    cfProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(output); // Show cloudflared errors/info
      
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (urlMatch) {
        tunnelUrl = urlMatch[0];
        clearTimeout(timeout);
        spinner.succeed(chalk.green('Cloudflared tunnel started!'));
        
        console.log(chalk.cyan('\n✅ Your public server address:\n'));
        console.log(chalk.white.bold(`  ${tunnelUrl}\n`));
        console.log(chalk.yellow('💡 Share this address with your friends!'));
        console.log(chalk.gray('📋 Keep this program running while playing.\n'));
        
        resolve(tunnelUrl);
      }
    });
    
    cfProcess.on('error', (error) => {
      clearTimeout(timeout);
      spinner.fail(chalk.red('Failed to start cloudflared'));
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
      resolve(null);
    });
    
    cfProcess.on('exit', (code) => {
      if (code !== 0 && !tunnelUrl) {
        clearTimeout(timeout);
        spinner.fail(chalk.red('Cloudflared process exited'));
        resolve(null);
      }
    });
    
    // Keep process alive
    cfProcess.unref();
  });
}

async function stopTunnel(service = 'playit') {
  const tunnelDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', service);
  const pidFile = path.join(tunnelDir, 'tunnel.pid');

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

async function showTunnelInfo(service = 'playit') {
  console.log(chalk.cyan('\n📋 Tunnel Service Information:\n'));
  
  if (service === 'ngrok') {
    console.log(chalk.white.bold('Service: Ngrok'));
    console.log(chalk.gray('Website: https://ngrok.com'));
    console.log(chalk.green('✓ TCP/UDP tunnels'));
    console.log(chalk.green('✓ Custom domains (paid)'));
    console.log(chalk.green('✓ Authentication support'));
    console.log(chalk.yellow('⚠ Requires account'));
    console.log(chalk.yellow('⚠ Free tier limits\n'));
  } else if (service === 'localtunnel') {
    console.log(chalk.white.bold('Service: LocalTunnel'));
    console.log(chalk.gray('Website: https://localtunnel.github.io/www'));
    console.log(chalk.green('✓ No account needed'));
    console.log(chalk.green('✓ Easy to use'));
    console.log(chalk.red('✗ HTTP/HTTPS only'));
    console.log(chalk.red('✗ Not compatible with Minecraft TCP\n'));
  } else if (service === 'bore') {
    console.log(chalk.white.bold('Service: Bore'));
    console.log(chalk.gray('Website: https://github.com/ekzhang/bore'));
    console.log(chalk.green('✓ Fast TCP tunnels'));
    console.log(chalk.green('✓ Open source'));
    console.log(chalk.green('✓ No account needed'));
    console.log(chalk.green('✓ Works great for Minecraft\n'));
  } else if (service === 'cloudflared') {
    console.log(chalk.white.bold('Service: Cloudflare Tunnel'));
    console.log(chalk.gray('Website: https://www.cloudflare.com'));
    console.log(chalk.green('✓ Secure tunnels'));
    console.log(chalk.green('✓ DDoS protection'));
    console.log(chalk.green('✓ Unlimited bandwidth'));
    console.log(chalk.yellow('⚠ Requires Cloudflare account\n'));
  } else {
    console.log(chalk.white.bold('Service: Playit.gg'));
    console.log(chalk.gray('Website: https://playit.gg'));
    console.log(chalk.green('✓ Minecraft optimized'));
    console.log(chalk.green('✓ Free forever'));
    console.log(chalk.green('✓ Easy setup'));
    console.log(chalk.green('✓ Custom domains\n'));
    
    const playitDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'playit');
    const pidFile = path.join(playitDir, 'tunnel.pid');

    if (await fs.pathExists(pidFile)) {
      const pid = await fs.readFile(pidFile, 'utf-8');
      console.log(chalk.cyan('🌐 Tunnel Status:\n'));
      console.log(chalk.white(`  Status: ${chalk.green('Running')}`));
      console.log(chalk.white(`  PID: ${pid}`));
      console.log(chalk.gray('\n📋 Check the Playit.gg dashboard for your public address.\n'));
    } else {
      console.log(chalk.yellow('⚠️  No tunnel is currently running.\n'));
    }
  }
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

module.exports = { 
  execute,
  getDefaultTunnelService,
  startTunnel,
  startNgrok,
  startLocalTunnel,
  startBore,
  startCloudflared,
  startPlayit,
  stopTunnel
};
