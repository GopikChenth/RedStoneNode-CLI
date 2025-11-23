const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

let serverProcess = null;
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
  
  console.log(chalk.green('▶️  Start Minecraft Server\n'));

  try {
    // Find servers in current directory
    const servers = await findServers(process.cwd());

    if (servers.length === 0) {
      console.log(chalk.yellow('⚠️  No servers found in current directory.'));
      console.log(chalk.cyan('\n💡 Initialize a server first using "Initialize server".\n'));
      return;
    }

    // Select server to start
    const { selectedServer } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedServer',
        message: 'Select server to start:',
        choices: servers.map(s => ({ name: s.name, value: s.path }))
      }
    ]);

    // Load server config
    const configPath = path.join(selectedServer, '.redstone', 'config.json');
    const config = await fs.readJson(configPath);

    // Check if server is already running
    const pidPath = path.join(selectedServer, '.redstone', 'server.pid');
    if (await fs.pathExists(pidPath)) {
      console.log(chalk.yellow('\n⚠️  Server appears to be already running.'));
      console.log(chalk.cyan('💡 Use "Stop server" to stop it first.\n'));
      return;
    }

    // Find server JAR
    const jarFiles = (await fs.readdir(selectedServer)).filter(f => f.endsWith('.jar'));
    if (jarFiles.length === 0) {
      console.log(chalk.red('\n❌ No server JAR found!'));
      console.log(chalk.cyan('💡 Place the server JAR file in:'), chalk.white(selectedServer + '\n'));
      return;
    }

    const jarFile = jarFiles[0];
    
    // Check Java version compatibility
    const javaDetector = require('../utils/java-detector');
    const javaInfo = await javaDetector.detect();
    
    if (javaInfo.found) {
      const javaVersion = parseInt(javaInfo.version.split('.')[0]);
      const mcVersion = config.minecraftVersion;
      let requiredJava = 17;
      
      if (mcVersion.startsWith('1.21') || mcVersion.startsWith('1.22')) {
        requiredJava = 21;
      } else if (mcVersion.startsWith('1.18') || mcVersion.startsWith('1.19') || mcVersion.startsWith('1.20')) {
        requiredJava = 17;
      } else if (mcVersion.startsWith('1.17')) {
        requiredJava = 16;
      } else {
        requiredJava = 8;
      }
      
      if (javaVersion < requiredJava) {
        console.log(chalk.red('\n⚠️  Java Version Mismatch!'));
        console.log(chalk.yellow(`Minecraft ${mcVersion} requires Java ${requiredJava}+`));
        console.log(chalk.yellow(`You have Java ${javaInfo.version}`));
        console.log(chalk.cyan('\nDownload JDK ' + requiredJava + ':'));
        console.log(chalk.green.bold(`https://adoptium.net/temurin/releases/?version=${requiredJava}`));
        console.log(chalk.red('\n❌ Cannot start server with incompatible Java version.\n'));
        return;
      }
    }
    
    const spinner = ora('Starting server...').start();

    // Build Java command
    const javaCmd = `"${config.javaPath || 'java'}" -Xmx${config.ramAllocation} -Xms${config.ramAllocation} -jar ${jarFile} nogui`;

    // Create a batch/shell script to run the server
    const scriptExt = process.platform === 'win32' ? '.bat' : '.sh';
    const scriptPath = path.join(selectedServer, 'start-server' + scriptExt);
    
    if (process.platform === 'win32') {
      const scriptContent = `@echo off\ncd /d "${selectedServer}"\n${javaCmd}\npause`;
      await fs.writeFile(scriptPath, scriptContent);
    } else {
      const scriptContent = `#!/bin/bash\ncd "${selectedServer}"\n${javaCmd}`;
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, '755');
    }

    // Start server process in background (no console window)
    if (process.platform === 'win32') {
      // Run without opening a window - use CREATE_NO_WINDOW flag
      const { exec } = require('child_process');
      serverProcess = spawn('cmd.exe', ['/c', scriptPath], {
        cwd: selectedServer,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
    } else {
      serverProcess = spawn('nohup', [scriptPath], {
        cwd: selectedServer,
        detached: true,
        stdio: 'ignore'
      });
    }

    // Save PID (using the spawned process PID)
    // Note: On Windows with 'start' command, this is the cmd.exe PID, not the java PID
    // But it's sufficient for tracking the server lifecycle
    await fs.writeFile(pidPath, serverProcess.pid.toString());

    // Unref so the parent process can exit
    serverProcess.unref();

    // Wait a bit to ensure server started properly
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.succeed(chalk.green('Server started!'));

    console.log(chalk.cyan('\nServer Info:'));
    console.log(chalk.white(`  Name: ${config.serverName}`));
    console.log(chalk.white(`  Type: ${config.serverType}`));
    console.log(chalk.white(`  Version: ${config.minecraftVersion}`));
    console.log(chalk.white(`  Port: ${config.port}`));
    console.log(chalk.white(`  RAM: ${config.ramAllocation}`));
    console.log(chalk.white(`  PID: ${serverProcess.pid}`));

    // Ask about tunnel
    const { startTunnel } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startTunnel',
        message: 'Create public tunnel with Playit.gg?',
        default: true
      }
    ]);

    if (startTunnel) {
      await setupTunnel(config.port, selectedServer);
    } else {
      const boxWidth = 56;
      const line = '═'.repeat(boxWidth);
      const localAddress = 'localhost:' + config.port;
      
      console.log(chalk.cyan(`\n╔${line}╗`));
      console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER ADDRESS') + ' '.repeat(boxWidth - 16) + chalk.cyan('║'));
      console.log(chalk.cyan(`╠${line}╣`));
      console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
      console.log(chalk.cyan('║  ') + chalk.gray('Local (Same network only):') + ' '.repeat(boxWidth - 28) + chalk.cyan('║'));
      console.log(chalk.cyan('║  ') + chalk.yellow(localAddress) + ' '.repeat(boxWidth - localAddress.length - 2) + chalk.cyan('║'));
      console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
      console.log(chalk.cyan(`╚${line}╝`));
      
      console.log(chalk.yellow('\n💡 Server is running locally'));
      console.log(chalk.gray('💡 Only players on the same network can join\n'));
      console.log(chalk.cyan('📋 Logs: ') + chalk.white(path.join(selectedServer, 'logs')));
      console.log(chalk.cyan('⏹️  Stop server using "Stop server" option.\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Failed to start server:'), error.message);
  }
}

async function findServers(dir) {
  const servers = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      const configPath = path.join(itemPath, '.redstone', 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        servers.push({
          name: config.serverName,
          path: itemPath
        });
      }
    }
  }

  return servers;
}

async function setupTunnel(port, serverPath) {
  const playitDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'playit');
  await fs.ensureDir(playitDir);
  
  const playitExe = path.join(playitDir, process.platform === 'win32' ? 'playit.exe' : 'playit');
  
  // Check if playit is downloaded
  if (!await fs.pathExists(playitExe)) {
    const spinner = ora('Downloading Playit.gg...').start();
    
    try {
      const downloadUrl = process.platform === 'win32'
        ? 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe'
        : process.platform === 'android' || process.env.PREFIX?.includes('com.termux')
        ? 'https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-arm64'
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

  const spinner = ora('Starting tunnel...').start();
  const pidFile = path.join(playitDir, 'tunnel.pid');
  const logFile = path.join(playitDir, 'playit-output.log');

  // Start playit process with output visible
  tunnelProcess = spawn(playitExe, [], {
    cwd: playitDir,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await fs.writeFile(pidFile, tunnelProcess.pid.toString());

  let tunnelUrl = '';
  let outputBuffer = '';
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Capture output to get tunnel URL
  const captureOutput = (data) => {
    const output = data.toString();
    outputBuffer += output;
    logStream.write(output);
    
    // Look for the tunnel URL in output - Playit uses format: domain.gl.joinmc.link
    const patterns = [
      /([a-z0-9-]+\.gl\.joinmc\.link)/i,
      /([a-z0-9-]+\.playit\.gg:\d+)/i,
      /hosting.*?on.*?([a-z0-9-]+\.(?:gl\.joinmc\.link|playit\.gg)(?::\d+)?)/i,
      /tunnel.*?at.*?([a-z0-9-]+\.(?:gl\.joinmc\.link|playit\.gg)(?::\d+)?)/i,
      /TUNNELS\s+([a-z0-9-]+\.gl\.joinmc\.link)/i
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match && match[1]) {
        tunnelUrl = match[1];
        break;
      }
    }
  };

  tunnelProcess.stdout.on('data', captureOutput);
  tunnelProcess.stderr.on('data', captureOutput);

  tunnelProcess.on('exit', async () => {
    logStream.end();
    await fs.remove(pidFile);
  });

  // Wait for tunnel to establish and keep checking for URL
  let claimUrl = '';
  let attempts = 0;
  while (attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    // Check for claim URL (first time setup)
    const claimMatch = outputBuffer.match(/https:\/\/playit\.gg\/claim\/[a-z0-9]+/i);
    if (claimMatch) {
      claimUrl = claimMatch[0];
    }
    
    // Try to parse tunnel address from output - multiple patterns
    const urlMatch = outputBuffer.match(/(?:hosting on|tunnel at|address:|running at).*?([a-z0-9-]+\.playit\.gg:\d+)/i) ||
                     outputBuffer.match(/([a-z0-9-]+\.playit\.gg:\d+)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      break;
    }
    
    // Also check if playit config exists (already claimed)
    const configPath = path.join(playitDir, 'playit.toml');
    if (await fs.pathExists(configPath)) {
      try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        // Look for tunnel info in config
        if (configContent.includes('tunnel') && !claimUrl) {
          // Already claimed, address should appear in output
        }
      } catch (e) {}
    }
  }
  
  spinner.succeed(chalk.green('Tunnel started!'));
  
  if (claimUrl && !tunnelUrl) {
    // First time setup
    console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.yellow.bold('  SETUP YOUR TUNNEL                                         ') + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║                                                            ║'));
    console.log(chalk.cyan('║  ') + chalk.white.bold('Step 1: Click this link                                ') + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.green.bold(claimUrl.padEnd(54)) + chalk.cyan('║'));
    console.log(chalk.cyan('║                                                            ║'));
    console.log(chalk.cyan('║  ') + chalk.white.bold('Step 2: Configure tunnel                               ') + chalk.cyan('║'));
    console.log(chalk.cyan('║    ') + chalk.gray('Region: ') + chalk.white('Global Anycast (free)                      ') + chalk.cyan('║'));
    console.log(chalk.cyan('║    ') + chalk.gray('Tunnel Type: ') + chalk.white('Minecraft Java                     ') + chalk.cyan('║'));
    console.log(chalk.cyan('║    ') + chalk.gray('Local Port: ') + chalk.white('25565                              ') + chalk.cyan('║'));
    console.log(chalk.cyan('║                                                            ║'));
    console.log(chalk.cyan('║  ') + chalk.white.bold('Step 3: Click "Add Tunnel"                             ') + chalk.cyan('║'));
    console.log(chalk.cyan('║                                                            ║'));
    console.log(chalk.cyan('║  ') + chalk.white.bold('Step 4: Copy your server address                       ') + chalk.cyan('║'));
    console.log(chalk.cyan('║    ') + chalk.green('It will look like: ') + chalk.yellow.bold('abc123.playit.gg:12345     ') + chalk.cyan('║'));
    console.log(chalk.cyan('║                                                            ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
    console.log(chalk.yellow('\n💡 Share that address with friends to let them join your server!'));
    console.log(chalk.gray('💡 Keep the tunnel running while playing.\n'));
  } else if (tunnelUrl) {
    const boxWidth = 56;
    const line = '═'.repeat(boxWidth);
    
    console.log(chalk.cyan(`\n╔${line}╗`));
    console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER ADDRESSES') + ' '.repeat(boxWidth - 18) + chalk.cyan('║'));
    console.log(chalk.cyan(`╠${line}╣`));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.gray('Public (Share with friends):') + ' '.repeat(boxWidth - 30) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.green.bold(tunnelUrl) + ' '.repeat(boxWidth - tunnelUrl.length - 2) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.gray('Local (Same network only):') + ' '.repeat(boxWidth - 28) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.yellow('localhost:' + port) + ' '.repeat(boxWidth - ('localhost:' + port).length - 2) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    console.log(chalk.cyan(`╚${line}╝`));
    console.log(chalk.yellow('\n💡 Share the public address with your friends!'));
  } else {
    console.log(chalk.cyan('\n✅ Tunnel is running!'));
    console.log(chalk.yellow('\n💡 To find your server address:'));
    console.log(chalk.white('   1. Visit: ') + chalk.green.bold('https://playit.gg/account/agents'));
    console.log(chalk.white('   2. Look for your active tunnel'));
    console.log(chalk.white('   3. Copy and share the address with your friends!\n'));
  }
  
  console.log(chalk.gray('\n📋 Server logs: ' + path.join(serverPath, 'logs')));
  console.log(chalk.gray('⏹️  Stop server and tunnel using "Stop server" option.\n'));
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
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
