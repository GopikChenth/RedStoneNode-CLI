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

// Resolve server path (handles both default and custom locations)
async function resolveServerPath(serverName) {
  const serversDir = getServersDir();
  
  // Check if it's a link file
  const linkFile = path.join(serversDir, `${serverName}.link`);
  if (await fs.pathExists(linkFile)) {
    const linkData = await fs.readJson(linkFile);
    return linkData.path;
  }
  
  // Default location
  return path.join(serversDir, serverName);
}

// Check if a port is in use
async function checkPort(port) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is available
    });
    
    server.listen(port, '0.0.0.0');
  });
}

async function showPlayitTutorial() {
  console.clear();
  console.log(chalk.cyan('╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.green.bold('           🎮 PLAYIT.GG SETUP TUTORIAL                      ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
  console.log('');
  
  console.log(chalk.white.bold('What is Playit.gg?'));
  console.log(chalk.gray('Playit creates a public address for your server so friends'));
  console.log(chalk.gray('anywhere can connect - no port forwarding needed!'));
  console.log('');
  
  console.log(chalk.cyan('📋 SETUP STEPS:'));
  console.log('');
  console.log(chalk.white('1️⃣  Playit will download automatically (~10-15MB)'));
  console.log('');
  console.log(chalk.white('2️⃣  A ' + chalk.yellow('claim URL') + ' will appear like:'));
  console.log(chalk.gray('   ') + chalk.cyan('https://playit.gg/claim/ABC123'));
  console.log('');
  console.log(chalk.white('3️⃣  Open that URL in your browser'));
  console.log(chalk.gray('   • Sign in (or create a free account)'));
  console.log(chalk.gray('   • Click ') + chalk.green('"Claim Agent"'));
  console.log('');
  console.log(chalk.white('4️⃣  After claiming, ' + chalk.green('restart your server')));
  console.log('');
  console.log(chalk.white('5️⃣  Your public address will appear automatically:'));
  console.log(chalk.gray('   Example: ') + chalk.green('economic-theme.gl.joinmc.link'));
  console.log('');
  
  console.log(chalk.cyan('💡 TIPS:'));
  console.log(chalk.gray('• Free forever - no credit card needed'));
  console.log(chalk.gray('• Keep Termux/terminal open while server runs'));
  console.log(chalk.gray('• Share the public address with friends'));
  console.log(chalk.gray('• Dashboard: ') + chalk.cyan('https://playit.gg/account/agents'));
  
  const isTermux = (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) || 
                   fs.existsSync('/data/data/com.termux');
  if (isTermux) {
    console.log('');
    console.log(chalk.yellow('📱 ANDROID/TERMUX NOTES:'));
    console.log(chalk.gray('• Open claim URL in your phone browser'));
    console.log(chalk.gray('• Keep Termux in foreground or use split-screen'));
    console.log(chalk.gray('• Disable battery optimization for Termux'));
  }
  console.log('');
  
  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: 'Press Enter to continue...'
  }]);
  
  console.log(chalk.green('\n✅ Starting Playit setup...\n'));
}

async function startServer(serverName = null) {
  const serversDir = getServersDir();
  await fs.ensureDir(serversDir);
  
  // If no server specified, prompt to select
  if (!serverName) {
    let servers = [];
    try {
      const items = await fs.readdir(serversDir);
      for (const item of items) {
        if (item.endsWith('.link')) {
          // Link file
          const linkData = await fs.readJson(path.join(serversDir, item));
          servers.push(linkData.name);
        } else {
          const itemPath = path.join(serversDir, item);
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            servers.push(item);
          }
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
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'serverName',
      message: 'Select server:',
      choices: servers
    }]);
    
    serverName = answer.serverName;
  }

  // Resolve server path (handles custom locations)
  const serverPath = await resolveServerPath(serverName);
  const config = await fs.readJson(path.join(serverPath, 'redstone.json'));

  // Check server version and show warning if needed
  console.log(chalk.cyan(`\n🎮 Server: ${config.name || serverName}`));
  console.log(chalk.gray(`   Type: ${config.type} ${config.version}`));
  
  if (config.version) {
    console.log(chalk.yellow(`\n⚠️  Make sure your Minecraft client version matches: ${config.version}`));
    console.log(chalk.gray(`   If versions don't match, you'll see "Outdated client/server" error\n`));
  }

  // Determine recommended tunnel service based on platform
  const platform = process.platform;
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  const recommendedService = (platform === 'win32') ? 'Playit.gg' : 'Bore';
  
  // Ask about tunnel with platform-specific default
  const { useTunnel } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useTunnel',
    message: `Start with tunnel (${recommendedService} - Recommended)?`,
    default: true
  }]);

  console.log(chalk.cyan(`\n🚀 Starting ${serverName}...\n`));

  // Check if port 25565 is already in use and auto-kill
  const portInUse = await checkPort(25565);
  if (portInUse) {
    console.log(chalk.yellow('⚠️  Port 25565 is already in use'));
    console.log(chalk.cyan('🔄 Stopping existing server...\n'));
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      if (process.platform === 'win32') {
        // Windows - aggressive kill
        try {
          await execPromise('taskkill /F /IM java.exe');
        } catch (e) {
          // Try wmic if taskkill fails
          await execPromise('wmic process where "name=\'java.exe\'" delete');
        }
      } else {
        // Linux/Mac/Android - multiple kill attempts
        try {
          // First try graceful kill
          await execPromise('pkill java');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}
        
        // Then force kill
        try {
          await execPromise('pkill -9 java');
        } catch (e) {}
        
        // On Android, also try killall
        if (isTermux) {
          try {
            await execPromise('killall -9 java');
          } catch (e) {}
        }
      }
      
      // Wait longer for process cleanup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if port is now free
      const stillInUse = await checkPort(25565);
      if (stillInUse) {
        console.log(chalk.red('⚠️  Port still in use - trying to start anyway...\n'));
      } else {
        console.log(chalk.green('✅ Port freed successfully\n'));
      }
    } catch (error) {
      // Continue anyway
      console.log(chalk.gray('Attempting to start server...\n'));
    }
  }

  // Start tunnel first if needed
  let tunnelUrl = null;
  if (useTunnel) {
    if (isTermux) {
      // Android/Termux - Ask user to choose tunnel
      const { tunnelChoice } = await inquirer.prompt([{
        type: 'list',
        name: 'tunnelChoice',
        message: 'Choose tunnel service:',
        choices: [
          { name: '🌐 Playit.gg (Recommended - More Reliable)', value: 'playit' },
          { name: '🔧 Bore (Simpler - May Not Work)', value: 'bore' },
          { name: '🚫 Skip Tunnel (Local Network Only)', value: 'none' }
        ]
      }]);
      
      if (tunnelChoice === 'playit') {
        const os = require('os');
        const playitDir = path.join(os.homedir(), '.redstone', 'playit');
        const playitExists = await fs.pathExists(playitDir);
        
        if (!playitExists) {
          await showPlayitTutorial();
        }
        
        tunnelUrl = await startTunnel(serverPath);
      } else if (tunnelChoice === 'bore') {
        tunnelUrl = await startBoreTunnel();
      }
    } else if (platform === 'win32') {
      // Windows - use Playit
      const os = require('os');
      const playitDir = path.join(os.homedir(), '.redstone', 'playit');
      const playitExists = await fs.pathExists(playitDir);
      
      if (!playitExists) {
        await showPlayitTutorial();
      }
      
      tunnelUrl = await startTunnel(serverPath);
    } else {
      // Linux/Mac - use Bore
      tunnelUrl = await startBoreTunnel();
    }
  }

  // Start Minecraft server FIRST (before tunnel)
  await launchMinecraft(serverPath, config, tunnelUrl, useTunnel);
}

async function startTunnel(serverPath) {
  const spinner = ora('Starting Playit.gg tunnel...').start();

  try {
    // Download playit if not exists
    const playitPath = await ensurePlayit();

    // Start playit in a visible window (Windows) or screen session (Linux)
    let playit;
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows - run Playit with output capture AND visible window
      const logFile = path.join(serverPath, 'playit.log');
      
      // Start playit with redirected output to file
      playit = spawn(playitPath, [], {
        cwd: serverPath,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      spinner.start('Starting Playit tunnel...');
      
      // Wait for tunnel URL with proper capture
      return new Promise((resolve) => {
        let outputBuffer = '';
        let resolved = false;
        
        const captureOutput = (data) => {
          const text = data.toString();
          outputBuffer += text;
          
          // Look for Playit.gg address patterns
          const patterns = [
            /([a-z0-9-]+\.gl\.joinmc\.link)/i,
            /([a-z0-9-]+\.joinmc\.link)/i,
            /address:\s*([a-z0-9-]+\.playit\.gg:\d+)/i,
            /(?:tcp|udp):\/\/([a-z0-9-]+\.playit\.gg:\d+)/i,
            /tunnel.*?(?:to|at).*?([a-z0-9-]+\.playit\.gg:\d+)/i,
            /(?:connect|join).*?([a-z0-9-]+\.playit\.gg:\d+)/i,
            /\s+([a-z0-9-]+\.playit\.gg:\d+)\s+/i,
            /([a-z0-9-]+\.playit\.gg:\d+)/i
          ];
          
          // Check for claim code (first-time setup)
          const claimMatch = text.match(/claim.*?url:?\s*(https?:\/\/playit\.gg\/claim\/[a-zA-Z0-9-]+)/i);
          if (claimMatch && !resolved) {
            resolved = true;
            spinner.warn(chalk.yellow('First-time setup required'));
            console.log(chalk.yellow('\n🔑 First-time Playit.gg setup:\n'));
            console.log(chalk.white(`   1. Visit: ${chalk.cyan(claimMatch[1])}`));
            console.log(chalk.white('   2. Sign in and claim your agent'));
            console.log(chalk.white('   3. Restart the server after claiming\n'));
            playit.unref();
            resolve(null);
            return;
          }
          
          // Check for tunnel URL
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && !resolved) {
              resolved = true;
              const url = match[1];
              spinner.succeed(chalk.green('Tunnel started!'));
              console.log(chalk.green(`\n🌐 Public Address: ${chalk.white.bold(url)}\n`));
              
              // Save to config file
              const configPath = path.join(serverPath, 'redstone.json');
              fs.readJson(configPath).then(config => {
                config.tunnelUrl = url;
                config.lastTunnelUpdate = new Date().toISOString();
                fs.writeJson(configPath, config, { spaces: 2 }).catch(() => {});
              }).catch(() => {});
              
              playit.unref();
              resolve(url);
              return;
            }
          }
        };
        
        playit.stdout.on('data', captureOutput);
        playit.stderr.on('data', captureOutput);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            
            // Final attempt to find URL
            const finalMatch = outputBuffer.match(/([a-z0-9-]+\.(?:gl\.)?joinmc\.link)|([a-z0-9-]+\.playit\.gg:\d+)/i);
            if (finalMatch && finalMatch[1]) {
              spinner.succeed(chalk.green('Tunnel started!'));
              console.log(chalk.green(`\n🌐 Public Address: ${chalk.white.bold(finalMatch[1])}\n`));
              
              // Save to config
              const configPath = path.join(serverPath, 'redstone.json');
              fs.readJson(configPath).then(config => {
                config.tunnelUrl = finalMatch[1];
                config.lastTunnelUpdate = new Date().toISOString();
                fs.writeJson(configPath, config, { spaces: 2 }).catch(() => {});
              }).catch(() => {});
              
              playit.unref();
              resolve(finalMatch[1]);
              return;
            }
            
            spinner.warn(chalk.yellow('Tunnel starting...'));
            console.log(chalk.yellow('\n⏳ Waiting for tunnel address...\n'));
            console.log(chalk.white('   The address will appear in the server info box'));
            console.log(chalk.gray('   Or check: ') + chalk.cyan('https://playit.gg/account/agents\n'));
            playit.unref();
            resolve(null);
          }
        }, 30000);
      });
    }
    
    // Linux/Mac - use pipe to capture output
    playit = spawn(playitPath, [], {
      cwd: serverPath,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for tunnel URL
    return new Promise((resolve) => {
      let outputBuffer = '';
      let resolved = false;
      
      const captureOutput = (data) => {
        const text = data.toString();
        outputBuffer += text;
        
        // Look for Playit.gg address patterns (from v1.5)
        const patterns = [
          /([a-z0-9-]+\.gl\.joinmc\.link)/i,
          /([a-z0-9-]+\.joinmc\.link)/i,
          /address:\s*([a-z0-9-]+\.playit\.gg:\d+)/i,
          /(?:tcp|udp):\/\/([a-z0-9-]+\.playit\.gg:\d+)/i,
          /(?:https?:\/\/)?([a-z0-9-]+\.playit\.gg:\d+)/i,
          /tunnel.*?([a-z0-9-]+\.playit\.gg:\d+)/i
        ];
        
        // Check for claim code (first-time setup)
        const claimMatch = text.match(/claim url:?\s*(https?:\/\/playit\.gg\/claim\/[a-zA-Z0-9-]+)/i);
        if (claimMatch && !resolved) {
          resolved = true;
          spinner.warn(chalk.yellow('First-time setup required'));
          console.log(chalk.yellow('\n🔑 First-time Playit.gg setup:\n'));
          console.log(chalk.white(`   1. Visit: ${chalk.cyan(claimMatch[1])}`));
          console.log(chalk.white('   2. Sign in and claim your agent'));
          console.log(chalk.white('   3. Restart the server after claiming\n'));
          playit.unref();
          resolve(null);
          return;
        }
        
        // Check for tunnel URL
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1] && !resolved) {
            resolved = true;
            const url = match[1];
            spinner.succeed(chalk.green('Tunnel started!'));
            console.log(chalk.green(`\n🌐 Public Address: ${chalk.white.bold(url)}\n`));
            
            // Save to config file (like v1.5)
            const configPath = path.join(serverPath, 'redstone.json');
            fs.readJson(configPath).then(config => {
              config.tunnelUrl = url;
              config.lastTunnelUpdate = new Date().toISOString();
              fs.writeJson(configPath, config, { spaces: 2 }).catch(() => {});
            }).catch(() => {});
            
            playit.unref();
            resolve(url);
            return;
          }
        }
      };
      
      playit.stdout.on('data', captureOutput);
      playit.stderr.on('data', captureOutput);

      // Timeout after 25 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          
          // Final attempt to find URL
          const finalMatch = outputBuffer.match(/([a-z0-9-]+\.playit\.gg:\d+)/i);
          if (finalMatch && finalMatch[1]) {
            spinner.succeed(chalk.green('Tunnel started!'));
            console.log(chalk.green(`\n🌐 Public Address: ${chalk.white.bold(finalMatch[1])}\n`));
            playit.unref();
            resolve(finalMatch[1]);
            return;
          }
          
          spinner.warn(chalk.yellow('Tunnel starting...'));
          console.log(chalk.yellow('\n⏳ Waiting for tunnel address...\n'));
          console.log(chalk.white('   The address will appear in the server info box'));
          console.log(chalk.gray('   Or check: ') + chalk.cyan('https://playit.gg/account/agents\n'));
          playit.unref();
          resolve(null);
        }
      }, 25000);
    });
  } catch (error) {
    spinner.fail('Tunnel failed');
    console.log(chalk.red(`❌ Error: ${error.message}`));
    console.log(chalk.yellow('⚠️  Continuing without tunnel\n'));
    return null;
  }
}

async function launchMinecraft(serverPath, config, tunnelUrl) {
  // Load tunnel URL from config if not provided (like v1.5)
  if (!tunnelUrl && config.tunnelUrl) {
    tunnelUrl = config.tunnelUrl;
  }
  
  // If no tunnel URL yet, try to poll for it in background
  let pollingInterval = null;
  if (!tunnelUrl) {
    pollingInterval = setInterval(async () => {
      try {
        const configPath = path.join(serverPath, 'redstone.json');
        const updatedConfig = await fs.readJson(configPath);
        if (updatedConfig.tunnelUrl && updatedConfig.tunnelUrl !== tunnelUrl) {
          tunnelUrl = updatedConfig.tunnelUrl;
          // Refresh display with new URL
          await displayServerInfo(serverPath, config, tunnelUrl);
        }
      } catch (e) {
        // Ignore errors
      }
    }, 3000); // Check every 3 seconds
  }
  
  await displayServerInfo(serverPath, config, tunnelUrl);
  
  // Detect platform and Termux
  const platform = process.platform;
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  const javaCmd = platform === 'win32' ? 'java.exe' : 'java';

  // Start server in new window based on platform
  let server;
  
  if (platform === 'win32') {
    // Windows - open in new cmd window
    server = spawn('cmd', [
      '/c',
      'start',
      'cmd',
      '/k',
      `java -Xmx${config.ram}M -Xms${Math.floor(config.ram / 2)}M -jar server.jar nogui`
    ], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    });
    
    server.unref();
    
  } else if (isTermux) {
    // Termux/Android - direct Java execution without setsid (simpler, works better)
    console.log(chalk.yellow('\n📱 Starting server on Android...'));
    
    // Try to acquire wake lock to prevent device from sleeping
    try {
      spawn('termux-wake-lock', [], { detached: true, stdio: 'ignore' });
    } catch (e) {
      console.log(chalk.gray('   (Install termux-api for wake-lock support)'));
    }
    
    // Run Java directly in background
    server = spawn('java', [
      `-Xmx${config.ram}M`,
      `-Xms${Math.floor(config.ram / 2)}M`,
      '-jar',
      'server.jar',
      'nogui'
    ], {
      cwd: serverPath,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    const logFile = path.join(serverPath, 'logs', 'latest.log');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    server.stdout.pipe(logStream);
    server.stderr.pipe(logStream);
    
    server.unref();
    
    console.log(chalk.green('✓ Server started'));
    console.log(chalk.gray('  Check logs in: ') + chalk.cyan('logs/latest.log'));
    console.log(chalk.yellow('\n⚠️  Keep Termux app open in background!'));
    
    if (tunnelUrl && tunnelUrl.includes('bore.pub')) {
      console.log(chalk.cyan('\n📋 Troubleshooting Bore Connection:'));
      console.log(chalk.gray('  1. Check if Bore is running: ') + chalk.white('ps aux | grep bore'));
      console.log(chalk.gray('  2. Test connection: ') + chalk.white(`nc -zv bore.pub ${tunnelUrl.split(':')[1] || '25565'}`));
      console.log(chalk.gray('  3. Bore can be unreliable - consider using Playit instead'));
      console.log(chalk.gray('     Install: ') + chalk.cyan('npm install -g playit-cli'));
    }
    
  } else {
    // Linux/Mac - use screen or tmux if available
    const hasScreen = await checkCommand('screen');
    const hasTmux = await checkCommand('tmux');
    
    if (hasScreen) {
      server = spawn('screen', [
        '-dmS',
        'minecraft',
        'java',
        `-Xmx${config.ram}M`,
        `-Xms${Math.floor(config.ram / 2)}M`,
        '-jar',
        'server.jar',
        'nogui'
      ], {
        cwd: serverPath,
        detached: true,
        stdio: 'ignore'
      });
      
      server.unref();
      
    } else if (hasTmux) {
      server = spawn('tmux', [
        'new-session',
        '-d',
        '-s',
        'minecraft',
        `java -Xmx${config.ram}M -Xms${Math.floor(config.ram / 2)}M -jar server.jar nogui`
      ], {
        cwd: serverPath,
        detached: true,
        stdio: 'ignore'
      });
      
      server.unref();
      
    } else {
      // Fallback - run in background with nohup or setsid
      const hasNohup = await checkCommand('nohup');
      const hasSetsid = await checkCommand('setsid');
      
      if (hasNohup) {
        server = spawn('nohup', [
          'java',
          `-Xmx${config.ram}M`,
          `-Xms${Math.floor(config.ram / 2)}M`,
          '-jar',
          'server.jar',
          'nogui'
        ], {
          cwd: serverPath,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else if (hasSetsid) {
        server = spawn('setsid', [
          'java',
          `-Xmx${config.ram}M`,
          `-Xms${Math.floor(config.ram / 2)}M`,
          '-jar',
          'server.jar',
          'nogui'
        ], {
          cwd: serverPath,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Last resort - just spawn detached
        server = spawn('java', [
          `-Xmx${config.ram}M`,
          `-Xms${Math.floor(config.ram / 2)}M`,
          '-jar',
          'server.jar',
          'nogui'
        ], {
          cwd: serverPath,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      }
      
      const logFile = path.join(serverPath, 'server.log');
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });
      server.stdout.pipe(logStream);
      server.stderr.pipe(logStream);
      
      server.unref();
    }
  }
  
  // Wait for user to press Enter before returning to menu
  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: 'Press Enter to return to menu...'
  }]);
  
  // Stop polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
}

async function displayServerInfo(serverPath, config, tunnelUrl) {
  // Clear screen and show server running page
  console.clear();
  
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  if (isTermux) {
    // Mobile - compact display (max 50 chars width)
    console.log(chalk.cyan('╔════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.green.bold('          🎮 SERVER RUNNING               ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════╝'));
    console.log('');
    console.log(chalk.white.bold('📋 SERVER INFO'));
    console.log(chalk.gray('  Name:   ') + chalk.white(config.name));
    console.log(chalk.gray('  Type:   ') + chalk.white(`${config.type} ${config.version}`));
    console.log(chalk.gray('  RAM:    ') + chalk.white(`${(config.ram / 1024).toFixed(1)}GB`));
    console.log(chalk.gray('  Status: ') + chalk.green('● Running'));
    console.log('');
    console.log(chalk.white.bold('🌐 CONNECTION'));
  } else {
    // PC - full box display
    const boxWidth = 60;
    const line = '═'.repeat(boxWidth);
    
    console.log(chalk.cyan(`╔${line}╗`));
    console.log(chalk.cyan('║') + chalk.green.bold(' '.repeat(18) + '🎮 SERVER RUNNING' + ' '.repeat(24)) + chalk.cyan('║'));
    console.log(chalk.cyan(`╚${line}╝`));
    console.log('');
    
    console.log(chalk.cyan(`╔${line}╗`));
    console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER INFORMATION') + ' '.repeat(boxWidth - 20) + chalk.cyan('║'));
    console.log(chalk.cyan(`╠${line}╣`));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.gray('Name: ') + chalk.white(config.name) + ' '.repeat(boxWidth - 8 - config.name.length) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.gray('Type: ') + chalk.white(`${config.type} ${config.version}`) + ' '.repeat(Math.max(0, boxWidth - 8 - config.type.length - config.version.length)) + chalk.cyan('║'));
    const ramGB = (config.ram / 1024).toFixed(1) + 'GB';
    console.log(chalk.cyan('║  ') + chalk.gray('RAM:  ') + chalk.white(ramGB) + ' '.repeat(boxWidth - 8 - ramGB.length) + chalk.cyan('║'));
    
    // Show directory path (truncate if too long)
    const displayPath = serverPath.length > 50 ? '...' + serverPath.slice(-47) : serverPath;
    const pathPadding = Math.max(0, boxWidth - 8 - displayPath.length);
    console.log(chalk.cyan('║  ') + chalk.gray('Path: ') + chalk.white(displayPath) + ' '.repeat(pathPadding) + chalk.cyan('║'));
    
    console.log(chalk.cyan('║  ') + chalk.gray('Status: ') + chalk.green('● Running') + ' '.repeat(boxWidth - 18) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    console.log(chalk.cyan(`╠${line}╣`));
    console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER ADDRESSES') + ' '.repeat(boxWidth - 18) + chalk.cyan('║'));
    console.log(chalk.cyan(`╠${line}╣`));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
  }
  
  // Connection Addresses - platform-specific formatting
  if (tunnelUrl) {
    if (isTermux) {
      // Mobile - simple format (max 50 chars)
      console.log(chalk.gray('  Public: ') + chalk.green.bold(tunnelUrl));
    } else {
      // PC - boxed format
      const publicLabel = 'Public (Share with friends): ';
      const publicContent = publicLabel + tunnelUrl;
      const boxWidth = 60;
      const publicPadding = Math.max(0, boxWidth - publicContent.length);
      console.log(chalk.cyan('║  ') + chalk.gray(publicLabel) + chalk.green.bold(tunnelUrl) + ' '.repeat(publicPadding) + chalk.cyan('║'));
      console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    }
    
    // Add warning for Bore reliability
    if (tunnelUrl.includes('bore.pub')) {
      if (isTermux) {
        console.log(chalk.yellow('  ⚠️  Note: bore.pub may be unstable'));
      } else {
        const boxWidth = 60;
        console.log(chalk.cyan('║  ') + chalk.yellow('⚠️  Note: bore.pub can be unreliable') + ' '.repeat(boxWidth - 36) + chalk.cyan('║'));
        console.log(chalk.cyan('║  ') + chalk.gray('   If connection fails, check: ps aux | grep bore') + ' '.repeat(boxWidth - 51) + chalk.cyan('║'));
        console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
      }
    }
  } else {
    if (isTermux) {
      // Mobile - simple local only message
      console.log(chalk.yellow('  Local network only'));
    } else if (process.platform !== 'win32') {
      // PC Linux - Bore manual entry
      const boxWidth = 60;
      console.log(chalk.cyan('║  ') + chalk.gray('Tunnel: ') + chalk.yellow('Local network only') + ' '.repeat(boxWidth - 35) + chalk.cyan('║'));
      console.log(chalk.cyan('║  ') + chalk.gray('(Bore address entered manually)') + ' '.repeat(boxWidth - 34) + chalk.cyan('║'));
      console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    } else {
      // PC Windows - Playit waiting
      const boxWidth = 60;
      console.log(chalk.cyan('║  ') + chalk.yellow('⏳ Waiting for tunnel address...') + ' '.repeat(boxWidth - 33) + chalk.cyan('║'));
      console.log(chalk.cyan('║  ') + chalk.gray('Check: https://playit.gg/account/agents') + ' '.repeat(boxWidth - 43) + chalk.cyan('║'));
      console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    }
  }
  
  const localAddr = 'localhost:' + (config.port || 25565);
  
  if (isTermux) {
    // Mobile - simple format (max 50 chars)
    console.log(chalk.gray('  Local:  ') + chalk.yellow.bold(localAddr));
    console.log('');
  } else {
    // PC - boxed format
    const boxWidth = 60;
    const localLabel = 'Local (Same network only): ';
    const localContent = localLabel + localAddr;
    const localPadding = Math.max(0, boxWidth - localContent.length);
    console.log(chalk.cyan('║  ') + chalk.gray(localLabel) + chalk.yellow.bold(localAddr) + ' '.repeat(localPadding) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    const line = '═'.repeat(boxWidth);
    console.log(chalk.cyan(`╚${line}╝`));
    console.log('');
  }

  // Detect platform
  const platform = process.platform;
  const javaCmd = platform === 'win32' ? 'java.exe' : 'java';

  // Start server in new window based on platform
  let server;
  
  if (platform === 'win32') {
    // Windows - open in new cmd window
    server = spawn('cmd', [
      '/c',
      'start',
      'cmd',
      '/k',
      `java -Xmx${config.ram}M -Xms${Math.floor(config.ram / 2)}M -jar server.jar nogui`
    ], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    });
    
    server.unref();
    
    console.log(chalk.green('✅ Server started in new window!'));
    if (tunnelUrl) {
      console.log(chalk.cyan(`\n🌐 Connection Address: ${tunnelUrl}\n`));
    }
    
  } else {
    // Linux/Mac/Termux - use screen or tmux if available, otherwise inherit
    const hasScreen = await checkCommand('screen');
    const hasTmux = await checkCommand('tmux');
    
    if (hasScreen) {
      server = spawn('screen', [
        '-dmS',
        'minecraft',
        'java',
        `-Xmx${config.ram}M`,
        `-Xms${Math.floor(config.ram / 2)}M`,
        '-jar',
        'server.jar',
        'nogui'
      ], {
        cwd: serverPath,
        detached: true,
        stdio: 'ignore'
      });
      
      server.unref();
      console.log(chalk.green('✅ Server started in screen session "minecraft"'));
      console.log(chalk.gray('   Attach with: screen -r minecraft'));
      
    } else if (hasTmux) {
      server = spawn('tmux', [
        'new-session',
        '-d',
        '-s',
        'minecraft',
        `java -Xmx${config.ram}M -Xms${Math.floor(config.ram / 2)}M -jar server.jar nogui`
      ], {
        cwd: serverPath,
        detached: true,
        stdio: 'ignore'
      });
      
      server.unref();
      console.log(chalk.green('✅ Server started in tmux session "minecraft"'));
      console.log(chalk.gray('   Attach with: tmux attach -t minecraft'));
      
    } else {
      // Fallback - run in background with nohup
      console.log(chalk.yellow('⚠️  screen/tmux not found, running with nohup'));
      server = spawn('nohup', [
        'java',
        `-Xmx${config.ram}M`,
        `-Xms${Math.floor(config.ram / 2)}M`,
        '-jar',
        'server.jar',
        'nogui'
      ], {
        cwd: serverPath,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      const logFile = path.join(serverPath, 'server.log');
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });
      server.stdout.pipe(logStream);
      server.stderr.pipe(logStream);
      
      server.unref();
      console.log(chalk.green(`✅ Server started in background`));
      console.log(chalk.gray(`   Logs: ${logFile}`));
    }
    
    if (tunnelUrl) {
      console.log(chalk.cyan(`\n🌐 Connection Address: ${tunnelUrl}\n`));
    }
  }
  
  // Wait for user to press Enter before returning to menu
  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: 'Press Enter to return to menu...'
  }]);
}

async function checkCommand(cmd) {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec(`which ${cmd}`, (error) => {
      resolve(!error);
    });
  });
}

async function ensurePlayit() {
  const os = require('os');
  const platform = os.platform();
  const arch = os.arch();
  
  const playitDir = path.join(os.homedir(), '.redstone', 'playit');
  await fs.ensureDir(playitDir);

  let filename, url;
  if (platform === 'win32') {
    filename = 'playit-windows.exe';
    url = 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe';
  } else if (platform === 'linux' && (arch === 'arm64' || arch === 'aarch64')) {
    // Android/Termux ARM64
    filename = 'playit-linux-aarch64';
    url = 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-aarch64';
  } else if (platform === 'linux' && arch === 'arm') {
    // Android/Termux ARM32 (older devices)
    filename = 'playit-linux-armv7';
    url = 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-armv7';
  } else if (platform === 'linux') {
    filename = 'playit-linux-amd64';
    url = 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-amd64';
  } else if (platform === 'darwin') {
    filename = 'playit-darwin';
    url = 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-darwin-aarch64';
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const playitPath = path.join(playitDir, filename);

  // Download if not exists
  if (!await fs.pathExists(playitPath)) {
    const spinner = ora('Downloading Playit.gg...').start();
    
    try {
      const axios = require('axios');
      
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        maxRedirects: 5
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
    } catch (error) {
      spinner.fail('Download failed');
      throw new Error(`Failed to download Playit: ${error.message}`);
    }
  }

  return playitPath;
}

async function startBoreTunnel() {
  const spinner = ora('Checking Bore tunnel...').start();
  
  // Detect Termux/Android at top of function
  const isTermux = (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) || 
                   (process.env.HOME && process.env.HOME.includes('/com.termux/')) ||
                   fs.existsSync('/data/data/com.termux');
  
  try {
    // Check if bore is installed
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      await execPromise('bore --version');
      spinner.text = 'Starting Bore tunnel...';
    } catch (error) {
      spinner.info('Bore not installed - skipping tunnel');
      console.log(chalk.yellow('\n💡 Tunneling unavailable - Bore is not installed'));
      console.log(chalk.gray('   Your server will only be accessible on local network\n'));
      console.log(chalk.white('To enable public access, install Bore:\n'));
      
      if (process.platform === 'win32') {
        console.log(chalk.cyan('  1. Install Rust: https://rustup.rs'));
        console.log(chalk.cyan('  2. Run: cargo install bore-cli'));
        console.log(chalk.gray('\n  Or use Playit.gg (recommended for Windows)'));
      } else if (isTermux) {
        console.log(chalk.cyan('  📱 For Termux/Android:\n'));
        console.log(chalk.white('  1. Install Rust:'));
        console.log(chalk.cyan('     pkg install rust -y'));
        console.log(chalk.white('\n  2. Install Bore (takes 5-10 minutes):'));
        console.log(chalk.cyan('     cargo install bore-cli'));
        console.log(chalk.gray('\n  3. Add to PATH:'));
        console.log(chalk.cyan('     export PATH=$HOME/.cargo/bin:$PATH'));
        console.log(chalk.gray('\n  Note: Compilation needs ~500MB free RAM'));
      } else {
        console.log(chalk.cyan('  cargo install bore-cli'));
      }
      
      console.log(chalk.gray('\nMore info: https://github.com/ekzhang/bore\n'));
      return null;
    }
    
    // Check which bore command to use
    let boreCommand = 'bore';
    const cargoPath = path.join(process.env.HOME || os.homedir(), '.cargo', 'bin', 'bore');
    
    if (await fs.pathExists(cargoPath)) {
      boreCommand = cargoPath;
    }
    
    spinner.text = 'Starting Bore tunnel...';
    
    // Start bore tunnel - use pipe to capture output but also echo it
    const bore = spawn(boreCommand, ['local', '25565', '--to', 'bore.pub'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: !isTermux,
      env: process.env
    });
    
    // Capture and display output simultaneously (all platforms for debugging)
    spinner.stop();
    console.log(chalk.cyan('\n🚀 Starting Bore tunnel...'));
    console.log(chalk.gray(`Platform: ${process.platform}, Termux: ${isTermux}, PREFIX: ${process.env.PREFIX || 'not set'}`));
    console.log(chalk.gray('─'.repeat(60)));
    
    return new Promise((resolve) => {
      let outputBuffer = '';
      let resolved = false;
      
      const processOutput = (data) => {
        const text = data.toString();
        outputBuffer += text;
        
        // Echo output to user with debug marker
        console.log(chalk.gray('[BORE OUTPUT] ') + text.trim());
          
          // Look for bore.pub address patterns (multiple variations)
          const patterns = [
            /listening at bore\.pub:(\d+)/i,
            /bore\.pub:(\d+)/i,
            /port\s+(\d+)/i,
            /:(\d{4,5})/
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && !resolved) {
              const port = match[1];
              // Validate port number
              if (parseInt(port) > 1024 && parseInt(port) < 65535) {
                resolved = true;
                const tunnelUrl = `bore.pub:${port}`;
                
                console.log(chalk.gray('\n' + '─'.repeat(60)));
                console.log(chalk.green('\n✅ Bore tunnel detected!'));
                console.log(chalk.cyan('🌐 Public Address: ') + chalk.white.bold(tunnelUrl) + '\n');
                
                bore.unref();
                resolve(tunnelUrl);
                return;
              }
            }
          }
        };
        
        bore.stdout.on('data', processOutput);
        bore.stderr.on('data', processOutput);
        
        // Timeout after 15 seconds
        setTimeout(async () => {
          if (!resolved) {
            resolved = true;
            console.log(chalk.gray('\n' + '─'.repeat(60)));
            
            // Try to find address in buffer with multiple patterns
            let bufferMatch = outputBuffer.match(/bore\.pub:(\d+)/i);
            if (!bufferMatch) {
              bufferMatch = outputBuffer.match(/port\s+(\d+)/i);
            }
            
            if (bufferMatch && bufferMatch[1]) {
              const tunnelUrl = `bore.pub:${bufferMatch[1]}`;
              console.log(chalk.green('\n✅ Bore tunnel found!'));
              console.log(chalk.cyan('🌐 Public Address: ') + chalk.white.bold(tunnelUrl) + '\n');
              bore.unref();
              resolve(tunnelUrl);
            } else {
              // Manual fallback
              console.log(chalk.yellow('\n⚠️  Could not auto-detect tunnel address'));
              console.log(chalk.yellow('\n⚠️  Bore connection may have failed'));
              console.log(chalk.white('\n💡 To troubleshoot:\n'));
              console.log(chalk.cyan('   1. Test manually: ') + chalk.white('bore local 25565 --to bore.pub'));
              console.log(chalk.cyan('   2. Check if running: ') + chalk.white('ps aux | grep bore'));
              console.log(chalk.cyan('   3. If "timed out" error: bore.pub is down/blocked'));
              console.log(chalk.yellow('\n💡 Alternative: Use ngrok or Playit (more reliable)\n'));
              
              const { tunnelUrl } = await inquirer.prompt([{
                type: 'input',
                name: 'tunnelUrl',
                message: 'Enter Bore address (or leave empty):',
                default: '',
                validate: (input) => {
                  if (!input || input.trim() === '') return true;
                  if (!input.match(/bore\.pub:\d+/i)) {
                    return 'Invalid format. Should be: bore.pub:12345';
                  }
                  return true;
                }
              }]);
              
              if (tunnelUrl && tunnelUrl.trim() && tunnelUrl !== 'bore.pub:') {
                console.log(chalk.green('\n✅ Bore tunnel configured!'));
                console.log(chalk.cyan('🌐 Public Address: ') + chalk.white.bold(tunnelUrl.trim()) + '\n');
                bore.unref();
                resolve(tunnelUrl.trim());
              } else {
                console.log(chalk.gray('\nServer will be local network only\n'));
                bore.kill();
                resolve(null);
              }
            }
          }
        }, 15000);
        
      bore.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          console.log(chalk.red('\n❌ Bore tunnel failed'));
          console.log(chalk.yellow('\n⚠️  Common issues:'));
          console.log(chalk.gray('   • bore.pub might be down or blocked by your network'));
          console.log(chalk.gray('   • Your ISP/firewall may be blocking tunneling'));
          console.log(chalk.gray('   • Try manually: ') + chalk.cyan('bore local 25565 --to bore.pub'));
          console.log(chalk.yellow('\n💡 Alternative solutions:'));
          console.log(chalk.gray('   1. Use ngrok: ') + chalk.cyan('pkg install ngrok && ngrok tcp 25565'));
          console.log(chalk.gray('   2. Use Playit: See PLAYIT-SETUP.md'));
          console.log(chalk.gray('   3. Local network only (no tunnel)\n'));
          resolve(null);
        }
      });
    });
  } catch (error) {
    spinner.fail('Tunnel failed');
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
    return null;
  }
}

module.exports = { startServer };
