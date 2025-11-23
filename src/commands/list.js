const chalk = require('chalk');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const fs = require('fs-extra');
const path = require('path');

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
  
  console.log(chalk.blue('📋 Minecraft Servers\n'));

  try {
    const servers = await findAllServers(process.cwd());

    if (servers.length === 0) {
      console.log(chalk.yellow('⚠️  No servers found in current directory.'));
      console.log(chalk.cyan('\n💡 Create a server first using "Create new server".\n'));
      return;
    }

    // Create table
    const table = new Table({
      head: [
        chalk.cyan('Name'),
        chalk.cyan('Type'),
        chalk.cyan('Version'),
        chalk.cyan('Status'),
        chalk.cyan('Port'),
        chalk.cyan('RAM')
      ],
      style: {
        head: [],
        border: ['gray']
      }
    });

    for (const server of servers) {
      const status = server.running 
        ? chalk.green('● Running') 
        : chalk.gray('○ Stopped');

      table.push([
        server.name,
        server.type,
        server.version,
        status,
        server.port,
        server.ram
      ]);
    }

    console.log(table.toString());
    console.log('\n');

    // Let user select a server to manage
    const choices = servers.map(s => ({
      name: `${s.running ? '🟢' : '⚫'} ${s.name}`,
      value: s.path
    }));
    choices.push({ name: chalk.gray('← Back to main menu'), value: 'back' });

    // Check if ESC was pressed
    if (global.escPressed) {
      global.escPressed = false;
      return;
    }

    const { selectedServer } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedServer',
        message: 'Select a server to manage:',
        choices: choices
      }
    ]);

    if (selectedServer === 'back' || global.escPressed) {
      global.escPressed = false;
      return;
    }

    // Show server management menu
    await showServerMenu(selectedServer, servers.find(s => s.path === selectedServer));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

async function showServerMenu(serverPath, serverInfo) {
  const start = require('./start');
  const stop = require('./stop');
  const config = require('./config');
  const world = require('./world');

  console.log(chalk.cyan(`\n📂 Managing: ${chalk.white.bold(serverInfo.name)}\n`));

  // Build menu based on server status
  const actions = [];
  
  if (serverInfo.running) {
    actions.push({ name: 'Stop', value: 'stop' });
    actions.push({ name: 'View Logs', value: 'console' });
  } else {
    actions.push({ name: 'Start', value: 'start' });
  }
  
  actions.push({ name: 'World', value: 'world' });
  actions.push({ name: 'Server properties', value: 'properties' });
  actions.push({ name: 'Files', value: 'files' });
  actions.push(new inquirer.Separator());
  actions.push({ name: chalk.red('🗑️  Delete Server'), value: 'delete' });
  actions.push(new inquirer.Separator());
  actions.push({ name: chalk.gray('Back'), value: 'back' });

  // Check if ESC was pressed
  if (global.escPressed) {
    global.escPressed = false;
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: actions
    }
  ]);

  if (global.escPressed) {
    global.escPressed = false;
    return;
  }

  switch (action) {
    case 'start':
      // Start the selected server directly
      await startServer(serverPath);
      break;
    case 'stop':
      await stopServer(serverPath);
      break;
    case 'console':
      await openConsole(serverPath);
      break;
    case 'world':
      await manageWorld(serverPath);
      break;
    case 'properties':
      await manageProperties(serverPath);
      break;
    case 'files':
      await manageFiles(serverPath);
      break;
    case 'delete':
      await deleteServer(serverPath, serverInfo);
      return; // Return to server list after deletion
    case 'back':
      return;
  }
}

async function findAllServers(dir) {
  const servers = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      const configPath = path.join(itemPath, '.redstone', 'config.json');
      const pidPath = path.join(itemPath, '.redstone', 'server.pid');

      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        
        let running = false;
        if (await fs.pathExists(pidPath)) {
          const pid = parseInt(await fs.readFile(pidPath, 'utf-8'));
          running = isProcessRunning(pid);
          
          // Clean up stale PID
          if (!running) {
            await fs.remove(pidPath);
          }
        }

        servers.push({
          name: config.serverName,
          type: config.serverType,
          version: config.minecraftVersion,
          port: config.port,
          ram: config.ramAllocation,
          running: running,
          path: itemPath
        });
      }
    }
  }

  return servers;
}

function isProcessRunning(pid) {
  try {
    if (process.platform === 'win32') {
      require('child_process').execSync(`tasklist /FI "PID eq ${pid}"`, { stdio: 'ignore' });
      return true;
    } else {
      process.kill(pid, 0);
      return true;
    }
  } catch {
    return false;
  }
}

async function startServer(serverPath) {
  const ora = require('ora');
  const { spawn } = require('child_process');
  const https = require('https');
  
  console.log(chalk.green('\n▶️  Starting server...\n'));
  
  // Load server config
  const configPath = path.join(serverPath, '.redstone', 'config.json');
  const config = await fs.readJson(configPath);
  
  // Check if server is already running
  const pidPath = path.join(serverPath, '.redstone', 'server.pid');
  if (await fs.pathExists(pidPath)) {
    console.log(chalk.yellow('⚠️  Server appears to be already running.'));
    console.log(chalk.cyan('💡 Use "Stop" to stop it first.\n'));
    return;
  }
  
  // Find server JAR
  const jarFiles = (await fs.readdir(serverPath)).filter(f => f.endsWith('.jar'));
  if (jarFiles.length === 0) {
    console.log(chalk.red('❌ No server JAR found!'));
    console.log(chalk.cyan('💡 Place the server JAR file in: ' + serverPath + '\n'));
    return;
  }
  
  const jarFile = jarFiles[0];
  
  // Force kill any existing Java processes
  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    console.log(chalk.cyan('🔄 Checking for running servers...\n'));
    
    try {
      // Kill ALL java.exe processes (most reliable way)
      execSync('taskkill /IM java.exe /F', { stdio: 'ignore' });
      console.log(chalk.yellow('⚠️  Stopped existing Java processes\n'));
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // No Java processes found, that's fine
      console.log(chalk.green('✓ No conflicting processes found\n'));
    }
  }
  
  const spinner = ora('Starting server...').start();
  
  // Create a batch/shell script for console access
  const scriptExt = process.platform === 'win32' ? '.bat' : '.sh';
  const scriptPath = path.join(serverPath, 'start-server' + scriptExt);
  const javaCmd = `"${config.javaPath || 'java'}" -Xmx${config.ramAllocation} -Xms${config.ramAllocation} -jar ${jarFile} nogui`;
  
  if (process.platform === 'win32') {
    const scriptContent = `@echo off\ntitle Minecraft Server - ${config.serverName}\ncd /d "${serverPath}"\n${javaCmd}\npause`;
    await fs.writeFile(scriptPath, scriptContent);
  } else {
    const scriptContent = `#!/bin/bash\ncd "${serverPath}"\n${javaCmd}`;
    await fs.writeFile(scriptPath, scriptContent);
    await fs.chmod(scriptPath, '755');
  }
  
  let serverProcess;
  
  // Start server with interactive console window
  if (process.platform === 'win32') {
    serverProcess = spawn('cmd.exe', ['/c', 'start', 'Minecraft Server', scriptPath], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    });
  } else {
    serverProcess = spawn('x-terminal-emulator', ['-e', scriptPath], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    });
  }
  
  // Save PID
  await fs.writeFile(pidPath, serverProcess.pid.toString());
  serverProcess.unref();
  
  spinner.succeed(chalk.green('Server started!'));
  
  // Ask about tunneling
  const { startTunnel } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startTunnel',
      message: 'Create public tunnel with Playit.gg?',
      default: true
    }
  ]);
  
  let tunnelUrl = null;
  if (startTunnel) {
    tunnelUrl = await setupTunnel(config.port, serverPath);
  }
  
  // Show server running page
  await showServerRunningPage(serverPath, config, tunnelUrl);
}

async function showServerRunningPage(serverPath, config, tunnelUrl = null) {
  console.clear();
  
  const figlet = require('figlet');
  const banner = figlet.textSync('REDSTONE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
  });
  console.log(chalk.red(banner));
  console.log(chalk.gray('                                          v1.0.0\n'));
  
  console.log(chalk.green('✅ Server Running\n'));
  
  const boxWidth = 58;
  const line = '═'.repeat(boxWidth);
  
  const padLine = (label, value) => {
    const content = label + value;
    const padding = boxWidth - content.length - 2;
    return chalk.cyan('║  ') + chalk.gray(label) + chalk.white(value) + ' '.repeat(padding) + chalk.cyan('║');
  };
  
  console.log(chalk.cyan(`╔${line}╗`));
  console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER INFORMATION') + ' '.repeat(boxWidth - 20) + chalk.cyan('║'));
  console.log(chalk.cyan(`╠${line}╣`));
  console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
  console.log(padLine('Name:    ', config.serverName));
  console.log(padLine('Type:    ', config.serverType));
  console.log(padLine('Version: ', config.minecraftVersion));
  console.log(padLine('Port:    ', config.port.toString()));
  console.log(padLine('RAM:     ', config.ramAllocation));
  console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
  console.log(chalk.cyan(`╠${line}╣`));
  console.log(chalk.cyan('║  ') + chalk.white.bold('SERVER ADDRESSES') + ' '.repeat(boxWidth - 18) + chalk.cyan('║'));
  console.log(chalk.cyan(`╠${line}╣`));
  console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
  
  if (tunnelUrl) {
    const publicLabel = 'Public (Share with friends): ';
    const publicContent = publicLabel + tunnelUrl;
    const publicPadding = Math.max(0, boxWidth - publicContent.length - 2);
    console.log(chalk.cyan('║  ') + chalk.gray(publicLabel) + chalk.green.bold(tunnelUrl) + ' '.repeat(publicPadding) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
    
    const localAddr = 'localhost:' + config.port;
    const localLabel = 'Local (Same network only): ';
    const localContent = localLabel + localAddr;
    const localPadding = Math.max(0, boxWidth - localContent.length - 2);
    console.log(chalk.cyan('║  ') + chalk.gray(localLabel) + chalk.yellow(localAddr) + ' '.repeat(localPadding) + chalk.cyan('║'));
  } else {
    const localAddr = 'localhost:' + config.port;
    const localLabel = 'Local (Same network only): ';
    const localContent = localLabel + localAddr;
    const localPadding = Math.max(0, boxWidth - localContent.length - 2);
    console.log(chalk.cyan('║  ') + chalk.gray(localLabel) + chalk.yellow(localAddr) + ' '.repeat(localPadding) + chalk.cyan('║'));
  }
  
  console.log(chalk.cyan('║') + ' '.repeat(boxWidth) + chalk.cyan('║'));
  console.log(chalk.cyan(`╚${line}╝`));
  
  console.log('');
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Server options:',
      choices: [
        { name: 'Stop', value: 'stop' },
        { name: 'Console', value: 'console' },
        { name: chalk.gray('Back to menu'), value: 'back' }
      ]
    }
  ]);
  
  switch (action) {
    case 'stop':
      await stopServer(serverPath);
      break;
    case 'back':
      return;
  }
}

async function setupTunnel(port, serverPath) {
  const ora = require('ora');
  const { spawn } = require('child_process');
  const https = require('https');
  
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
      return null;
    }
  }

  const spinner = ora('Starting tunnel...').start();
  const pidFile = path.join(playitDir, 'tunnel.pid');
  const logFile = path.join(playitDir, 'playit-output.log');

  // Start playit process
  const tunnelProcess = spawn(playitExe, [], {
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
    
    const patterns = [
      /([a-z0-9-]+\.gl\.joinmc\.link)/i,
      /([a-z0-9-]+\.playit\.gg:\d+)/i
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

  // Wait for tunnel to establish
  let attempts = 0;
  while (attempts < 15 && !tunnelUrl) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  if (tunnelUrl) {
    spinner.succeed(chalk.green('Tunnel started!'));
    return tunnelUrl;
  } else {
    spinner.warn(chalk.yellow('Tunnel started (address pending)'));
    console.log(chalk.cyan('💡 Visit https://playit.gg/account/agents to see your tunnel address\n'));
    return null;
  }
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

async function stopServer(serverPath) {
  const ora = require('ora');
  
  console.log(chalk.yellow('\n⏹️  Stopping server...\n'));
  
  const pidPath = path.join(serverPath, '.redstone', 'server.pid');
  
  if (!await fs.pathExists(pidPath)) {
    console.log(chalk.yellow('⚠️  Server is not running.\n'));
    return;
  }
  
  const pid = parseInt(await fs.readFile(pidPath, 'utf-8'));
  const spinner = ora('Stopping server...').start();
  
  try {
    if (process.platform === 'win32') {
      const { execSync } = require('child_process');
      
      // Try multiple methods to ensure all server processes are killed
      try {
        // Method 1: Kill all Java processes in this server directory
        const serverDir = serverPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        execSync(`powershell "Get-Process java -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*${path.basename(serverPath)}*' } | Stop-Process -Force"`, { 
          stdio: 'ignore',
          timeout: 5000 
        });
      } catch (e) {
        // Method 2: Kill by PID with tree
        try {
          execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
        } catch (e2) {
          // Method 3: Kill all Java processes (last resort)
          try {
            execSync(`taskkill /IM java.exe /F`, { stdio: 'ignore' });
          } catch (e3) {
            // Ignore if no processes found
          }
        }
      }
      
      // Also kill wscript if running
      try {
        execSync(`taskkill /IM wscript.exe /F`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore
      }
    } else {
      process.kill(pid, 'SIGTERM');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fs.remove(pidPath);
    
    spinner.succeed(chalk.green('Server stopped!'));
    console.log(chalk.white('✅ Server has been stopped.\n'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to stop server'));
    
    if (await fs.pathExists(pidPath)) {
      await fs.remove(pidPath);
    }
    
    console.log(chalk.yellow('⚠️  Process may have already stopped.\n'));
  }
}

async function openConsole(serverPath) {
  console.log(chalk.cyan('\n💻 Opening server console...\n'));
  
  const { spawn } = require('child_process');
  const scriptPath = path.join(serverPath, 'start-server' + (process.platform === 'win32' ? '.bat' : '.sh'));
  
  if (!await fs.pathExists(scriptPath)) {
    console.log(chalk.red('❌ Server console script not found!\n'));
    return;
  }
  
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', 'Minecraft Server Console', scriptPath], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    spawn('x-terminal-emulator', ['-e', scriptPath], {
      cwd: serverPath,
      detached: true,
      stdio: 'ignore'
    }).unref();
  }
  
  console.log(chalk.green('✅ Console window opened!'));
  console.log(chalk.cyan('💡 You can now type Minecraft commands in the console.\n'));
}

async function manageWorld(serverPath) {
  console.log(chalk.cyan('\n🌍 World Management\n'));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: [
        { name: 'List worlds', value: 'list' },
        { name: 'Switch world', value: 'switch' },
        { name: 'Delete world', value: 'delete' },
        { name: chalk.gray('Back'), value: 'back' }
      ]
    }
  ]);
  
  if (action === 'back') return;
  
  const world = require('./world');
  // Call world command functions based on action
  console.log(chalk.yellow('\n💡 World management coming soon...\n'));
}

async function manageProperties(serverPath) {
  console.clear();
  
  const figlet = require('figlet');
  const banner = figlet.textSync('REDSTONE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
  });
  console.log(chalk.red(banner));
  console.log(chalk.gray('                                          v1.0.0\n'));
  
  console.log(chalk.cyan('⚙️  Server Properties\n'));
  
  const propsPath = path.join(serverPath, 'server.properties');
  
  if (!await fs.pathExists(propsPath)) {
    console.log(chalk.yellow('⚠️  server.properties not found.'));
    console.log(chalk.cyan('💡 Start the server once to generate it.\n'));
    return;
  }
  
  // Read current properties
  const propsContent = await fs.readFile(propsPath, 'utf-8');
  const props = {};
  propsContent.split('\n').forEach(line => {
    if (!line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      props[key.trim()] = value.trim();
    }
  });
  
  // Count OP and whitelist entries
  const opsPath = path.join(serverPath, 'ops.json');
  const whitelistPath = path.join(serverPath, 'whitelist.json');
  
  let opsCount = 0;
  let whitelistCount = 0;
  
  try {
    if (await fs.pathExists(opsPath)) {
      const opsData = JSON.parse(await fs.readFile(opsPath, 'utf-8'));
      opsCount = Array.isArray(opsData) ? opsData.length : 0;
    }
  } catch (e) {}
  
  try {
    if (await fs.pathExists(whitelistPath)) {
      const whitelistData = JSON.parse(await fs.readFile(whitelistPath, 'utf-8'));
      whitelistCount = Array.isArray(whitelistData) ? whitelistData.length : 0;
    }
  } catch (e) {}
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select property to edit:',
      choices: [
        { name: `Slots (${props['max-players'] || '20'})`, value: 'slots' },
        { name: `Gamemode (${props['gamemode'] || 'survival'})`, value: 'gamemode' },
        { name: `Difficulty (${props['difficulty'] || 'easy'})`, value: 'difficulty' },
        { name: `Whitelist (${props['white-list'] === 'true' ? 'enabled' : 'disabled'})`, value: 'whitelist' },
        { name: `Cracked/Online Mode (${props['online-mode'] === 'true' ? 'Premium' : 'Cracked'})`, value: 'online-mode' },
        { name: `Command Blocks (${props['enable-command-block'] === 'true' ? 'enabled' : 'disabled'})`, value: 'command-blocks' },
        { name: `Monsters (${props['spawn-monsters'] === 'true' ? 'enabled' : 'disabled'})`, value: 'monsters' },
        { name: `PVP (${props['pvp'] === 'true' ? 'enabled' : 'disabled'})`, value: 'pvp' },
        { name: `Flight (${props['allow-flight'] === 'true' ? 'enabled' : 'disabled'})`, value: 'flight' },
        { name: `Nether (${props['allow-nether'] === 'true' ? 'enabled' : 'disabled'})`, value: 'nether' },
        { name: `Force Gamemode (${props['force-gamemode'] === 'true' ? 'enabled' : 'disabled'})`, value: 'force-gamemode' },
        { name: `Spawn Protection (${props['spawn-protection'] || '0'})`, value: 'spawn-protection' },
        new inquirer.Separator(),
        { name: `👑 OP List (${opsCount} players)`, value: 'ops-list' },
        { name: `📋 Whitelist (${whitelistCount} players)`, value: 'whitelist-list' },
        new inquirer.Separator(),
        { name: chalk.gray('Back'), value: 'back' }
      ]
    }
  ]);
  
  if (action === 'back') return;
  
  if (action === 'ops-list') {
    await manageOPList(serverPath);
  } else if (action === 'whitelist-list') {
    await manageWhitelistList(serverPath);
  } else {
    await editProperty(propsPath, props, action);
  }
  
  // Show the menu again
  await manageProperties(serverPath);
}

async function editProperty(propsPath, props, property) {
  let newValue;
  
  switch (property) {
    case 'slots':
      const { slots } = await inquirer.prompt([
        {
          type: 'number',
          name: 'slots',
          message: 'Enter max players:',
          default: parseInt(props['max-players']) || 20,
          validate: v => v > 0 && v <= 100000
        }
      ]);
      await updateProperty(propsPath, 'max-players', slots.toString());
      console.log(chalk.green(`\n✅ Max players set to ${slots}\n`));
      break;
      
    case 'gamemode':
      const { gamemode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'gamemode',
          message: 'Select gamemode:',
          choices: ['survival', 'creative', 'adventure', 'spectator'],
          default: props['gamemode'] || 'survival'
        }
      ]);
      await updateProperty(propsPath, 'gamemode', gamemode);
      console.log(chalk.green(`\n✅ Gamemode set to ${gamemode}\n`));
      break;
      
    case 'difficulty':
      const { difficulty } = await inquirer.prompt([
        {
          type: 'list',
          name: 'difficulty',
          message: 'Select difficulty:',
          choices: ['peaceful', 'easy', 'normal', 'hard'],
          default: props['difficulty'] || 'easy'
        }
      ]);
      await updateProperty(propsPath, 'difficulty', difficulty);
      console.log(chalk.green(`\n✅ Difficulty set to ${difficulty}\n`));
      break;
      
    case 'whitelist':
      newValue = props['white-list'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'white-list', newValue);
      console.log(chalk.green(`\n✅ Whitelist ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'online-mode':
      newValue = props['online-mode'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'online-mode', newValue);
      console.log(chalk.green(`\n✅ Server set to ${newValue === 'true' ? 'Premium' : 'Cracked'} mode\n`));
      break;
      
    case 'command-blocks':
      newValue = props['enable-command-block'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'enable-command-block', newValue);
      console.log(chalk.green(`\n✅ Command blocks ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'monsters':
      newValue = props['spawn-monsters'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'spawn-monsters', newValue);
      console.log(chalk.green(`\n✅ Monster spawning ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'pvp':
      newValue = props['pvp'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'pvp', newValue);
      console.log(chalk.green(`\n✅ PVP ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'flight':
      newValue = props['allow-flight'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'allow-flight', newValue);
      console.log(chalk.green(`\n✅ Flight ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'nether':
      newValue = props['allow-nether'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'allow-nether', newValue);
      console.log(chalk.green(`\n✅ Nether ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'force-gamemode':
      newValue = props['force-gamemode'] === 'true' ? 'false' : 'true';
      await updateProperty(propsPath, 'force-gamemode', newValue);
      console.log(chalk.green(`\n✅ Force gamemode ${newValue === 'true' ? 'enabled' : 'disabled'}\n`));
      break;
      
    case 'spawn-protection':
      const { protection } = await inquirer.prompt([
        {
          type: 'number',
          name: 'protection',
          message: 'Enter spawn protection radius (0 to disable):',
          default: parseInt(props['spawn-protection']) || 0,
          validate: v => v >= 0
        }
      ]);
      await updateProperty(propsPath, 'spawn-protection', protection.toString());
      console.log(chalk.green(`\n✅ Spawn protection set to ${protection}\n`));
      break;
  }
}

async function updateProperty(propsPath, key, value) {
  let content = await fs.readFile(propsPath, 'utf-8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  
  await fs.writeFile(propsPath, content);
}

async function manageOPList(serverPath) {
  const opsPath = path.join(serverPath, 'ops.json');
  
  let ops = [];
  try {
    if (await fs.pathExists(opsPath)) {
      ops = JSON.parse(await fs.readFile(opsPath, 'utf-8'));
      if (!Array.isArray(ops)) ops = [];
    }
  } catch (e) {
    console.log(chalk.yellow('\n⚠️  Could not read ops.json\n'));
    return;
  }
  
  console.log(chalk.cyan('\n👑 OP List Management\n'));
  
  if (ops.length === 0) {
    console.log(chalk.yellow('No operators configured.\n'));
  } else {
    console.log(chalk.white('Current OPs:'));
    ops.forEach((op, i) => {
      console.log(chalk.green(`  ${i + 1}. ${op.name} (Level ${op.level || 4})`));
    });
    console.log();
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: [
        { name: 'Add OP', value: 'add' },
        ...(ops.length > 0 ? [{ name: 'Remove OP', value: 'remove' }] : []),
        { name: chalk.gray('Back'), value: 'back' }
      ]
    }
  ]);
  
  if (action === 'back') return;
  
  if (action === 'add') {
    const { username, level } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter player username:',
        validate: input => input.trim() ? true : 'Username required'
      },
      {
        type: 'list',
        name: 'level',
        message: 'Select OP level:',
        choices: [
          { name: 'Level 1 - Bypass spawn protection', value: 1 },
          { name: 'Level 2 - Use cheat commands + Level 1', value: 2 },
          { name: 'Level 3 - Use most commands + Level 2', value: 3 },
          { name: 'Level 4 - All commands + Level 3', value: 4 }
        ],
        default: 4
      }
    ]);
    
    const newOp = {
      uuid: '00000000-0000-0000-0000-000000000000',
      name: username.trim(),
      level: level,
      bypassesPlayerLimit: false
    };
    
    ops.push(newOp);
    await fs.writeFile(opsPath, JSON.stringify(ops, null, 2));
    console.log(chalk.green(`\n✅ Added ${username} as OP (Level ${level})\n`));
  } else if (action === 'remove') {
    const { opToRemove } = await inquirer.prompt([
      {
        type: 'list',
        name: 'opToRemove',
        message: 'Select OP to remove:',
        choices: ops.map((op, i) => ({
          name: `${op.name} (Level ${op.level || 4})`,
          value: i
        }))
      }
    ]);
    
    const removed = ops.splice(opToRemove, 1)[0];
    await fs.writeFile(opsPath, JSON.stringify(ops, null, 2));
    console.log(chalk.green(`\n✅ Removed ${removed.name} from OP list\n`));
  }
  
  await manageOPList(serverPath);
}

async function manageWhitelistList(serverPath) {
  const whitelistPath = path.join(serverPath, 'whitelist.json');
  
  let whitelist = [];
  try {
    if (await fs.pathExists(whitelistPath)) {
      whitelist = JSON.parse(await fs.readFile(whitelistPath, 'utf-8'));
      if (!Array.isArray(whitelist)) whitelist = [];
    }
  } catch (e) {
    console.log(chalk.yellow('\n⚠️  Could not read whitelist.json\n'));
    return;
  }
  
  console.log(chalk.cyan('\n📋 Whitelist Management\n'));
  
  if (whitelist.length === 0) {
    console.log(chalk.yellow('No players whitelisted.\n'));
  } else {
    console.log(chalk.white('Whitelisted players:'));
    whitelist.forEach((player, i) => {
      console.log(chalk.green(`  ${i + 1}. ${player.name}`));
    });
    console.log();
  }
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: [
        { name: 'Add player', value: 'add' },
        ...(whitelist.length > 0 ? [{ name: 'Remove player', value: 'remove' }] : []),
        { name: chalk.gray('Back'), value: 'back' }
      ]
    }
  ]);
  
  if (action === 'back') return;
  
  if (action === 'add') {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter player username:',
        validate: input => input.trim() ? true : 'Username required'
      }
    ]);
    
    const newPlayer = {
      uuid: '00000000-0000-0000-0000-000000000000',
      name: username.trim()
    };
    
    whitelist.push(newPlayer);
    await fs.writeFile(whitelistPath, JSON.stringify(whitelist, null, 2));
    console.log(chalk.green(`\n✅ Added ${username} to whitelist\n`));
  } else if (action === 'remove') {
    const { playerToRemove } = await inquirer.prompt([
      {
        type: 'list',
        name: 'playerToRemove',
        message: 'Select player to remove:',
        choices: whitelist.map((player, i) => ({
          name: player.name,
          value: i
        }))
      }
    ]);
    
    const removed = whitelist.splice(playerToRemove, 1)[0];
    await fs.writeFile(whitelistPath, JSON.stringify(whitelist, null, 2));
    console.log(chalk.green(`\n✅ Removed ${removed.name} from whitelist\n`));
  }
  
  await manageWhitelistList(serverPath);
}

async function manageFiles(serverPath) {
  console.log(chalk.cyan('\n📁 Server Files\n'));
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select option:',
      choices: [
        { name: 'Open server folder', value: 'open' },
        { name: 'View logs', value: 'logs' },
        { name: 'Manage plugins/mods', value: 'plugins' },
        { name: 'Backup server', value: 'backup' },
        { name: chalk.gray('Back'), value: 'back' }
      ]
    }
  ]);
  
  if (action === 'back') return;
  
  if (action === 'open') {
    const { spawn } = require('child_process');
    console.log(chalk.cyan('\n📂 Opening server folder...\n'));
    
    if (process.platform === 'win32') {
      spawn('explorer', [serverPath], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [serverPath], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [serverPath], { detached: true, stdio: 'ignore' }).unref();
    }
    
    console.log(chalk.green('✅ Folder opened!\n'));
  } else if (action === 'logs') {
    const logsPath = path.join(serverPath, 'logs');
    if (await fs.pathExists(logsPath)) {
      const logFiles = await fs.readdir(logsPath);
      console.log(chalk.cyan('\n📋 Log files:'));
      logFiles.slice(0, 10).forEach(file => console.log(chalk.white('  - ' + file)));
      console.log(chalk.gray('\n💡 Located at: ' + logsPath + '\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  No logs folder found.\n'));
    }
  } else {
    console.log(chalk.yellow('\n💡 Feature coming soon...\n'));
  }
}

async function deleteServer(serverPath, serverInfo) {
  console.log(chalk.red('\n🗑️  Delete Server\n'));
  console.log(chalk.yellow(`⚠️  You are about to delete: ${chalk.white.bold(serverInfo.name)}\n`));
  console.log(chalk.red('This will permanently delete:'));
  console.log(chalk.white('  - All server files'));
  console.log(chalk.white('  - All worlds'));
  console.log(chalk.white('  - All configurations'));
  console.log(chalk.white('  - All logs and backups\n'));
  
  const { confirmDelete } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: 'Are you absolutely sure you want to delete this server? (y/n)',
      default: false
    }
  ]);
  
  if (!confirmDelete) {
    console.log(chalk.green('\n✅ Deletion cancelled. Server is safe!\n'));
    return;
  }
  
  // Double confirmation for safety
  const { confirmAgain } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirmAgain',
      message: `Type the server name "${serverInfo.name}" to confirm deletion:`,
      validate: input => input === serverInfo.name ? true : 'Server name does not match'
    }
  ]);
  
  if (confirmAgain !== serverInfo.name) {
    console.log(chalk.green('\n✅ Deletion cancelled. Server is safe!\n'));
    return;
  }
  
  // Stop server if running
  if (serverInfo.running) {
    console.log(chalk.cyan('\n🛑 Stopping server before deletion...\n'));
    await stopServer(serverPath);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Kill any Java processes that might be using the folder
  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    console.log(chalk.cyan('🔄 Ensuring all processes are closed...\n'));
    try {
      execSync('taskkill /IM java.exe /F', { stdio: 'ignore' });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      // No Java processes, that's fine
    }
  }
  
  // Delete the server directory
  const ora = require('ora');
  const spinner = ora('Deleting server...').start();
  
  try {
    // Try multiple times with delay
    let deleted = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await fs.remove(serverPath);
        deleted = true;
        break;
      } catch (error) {
        if (attempt < 3) {
          spinner.text = `Deleting server... (Attempt ${attempt + 1}/3)`;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw error;
        }
      }
    }
    
    if (deleted) {
      spinner.succeed(chalk.green('Server deleted successfully!'));
      console.log(chalk.green(`\n✅ ${serverInfo.name} has been permanently deleted.\n`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to delete server'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    console.log(chalk.yellow('💡 The server folder may be locked. Try these steps:\n'));
    console.log(chalk.white('   1. Close any File Explorer windows showing this folder'));
    console.log(chalk.white('   2. Close any terminals or editors in this folder'));
    console.log(chalk.white('   3. Wait a few seconds and try again'));
    console.log(chalk.white('   4. Or manually delete the folder:\n'));
    console.log(chalk.cyan(`      ${serverPath}\n`));
  }
}

module.exports = { execute };
