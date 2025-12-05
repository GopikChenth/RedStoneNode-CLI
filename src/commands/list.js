/**
 * List Command - Show servers table and menu
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const os = require('os');

// Get servers directory - returns shared storage on Android/Termux by default
const getServersDir = () => {
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  if (isTermux) {
    // Check if storage is accessible
    const sharedStorage = '/storage/emulated/0/Documents/RedStone-Servers';
    try {
      if (fs.existsSync('/storage/emulated/0')) {
        return sharedStorage;
      }
    } catch (e) {
      // Fall back to Termux home if shared storage not accessible
    }
    // Fallback to Termux home if storage not set up
    return path.join(os.homedir(), '.redstone', 'servers');
  }
  
  // Windows/Linux/Mac - use home directory
  return path.join(os.homedir(), '.redstone', 'servers');
};

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

// Show Termux file paths for manual navigation
function showTermuxFilePaths(serverPath) {
  console.log(chalk.white('📁 Access your server files:\n'));
  
  console.log(chalk.cyan('Option 1:') + chalk.white(' Direct Path'));
  console.log(chalk.gray(`   ${serverPath}\n`));
  
  console.log(chalk.cyan('Option 2:') + chalk.white(' Termux Home Directory'));
  console.log(chalk.gray('   /data/data/com.termux/files/home/.redstone/servers/\n'));
  
  console.log(chalk.cyan('Option 3:') + chalk.white(' Document Provider URI (for file pickers)'));
  console.log(chalk.gray('   content://com.termux.documents/tree/%2Fdata%2Fdata%2F'));
  console.log(chalk.gray('   com.termux%2Ffiles%2Fhome\n'));
  
  console.log(chalk.white('💡 Tip: Run ') + chalk.cyan('termux-setup-storage') + chalk.white(' for easier access\n'));
}

// Open server files in file manager
async function openServerFiles(serverPath) {
  const { exec } = require('child_process');
  const { spawn } = require('child_process');
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  console.log(chalk.cyan(`\n📁 Server Location:\n`));
  console.log(chalk.white(`   ${serverPath}\n`));
  
  if (isTermux) {
    // Android/Termux - use termux-open
    console.log(chalk.yellow('📱 Opening in file manager...\n'));
    
    try {
      // Try termux-open first
      const termuxOpen = spawn('termux-open', [serverPath], {
        detached: true,
        stdio: 'ignore'
      });
      
      termuxOpen.on('error', (err) => {
        // If termux-open fails, show manual instructions
        console.log(chalk.yellow('⚠️  termux-open not available\n'));
        showTermuxFilePaths(serverPath);
      });
      
      termuxOpen.unref();
      
      console.log(chalk.gray('If file manager didn\'t open, navigate manually:\n'));
      showTermuxFilePaths(serverPath);
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not open file manager\n'));
      showTermuxFilePaths(serverPath);
    }
    
  } else if (process.platform === 'win32') {
    // Windows - use explorer
    console.log(chalk.green('✅ Opening in File Explorer...\n'));
    exec(`explorer "${serverPath}"`);
    
  } else if (process.platform === 'darwin') {
    // macOS - use Finder
    console.log(chalk.green('✅ Opening in Finder...\n'));
    exec(`open "${serverPath}"`);
    
  } else {
    // Linux - use xdg-open
    console.log(chalk.green('✅ Opening file manager...\n'));
    exec(`xdg-open "${serverPath}"`, (error) => {
      if (error) {
        console.log(chalk.yellow('⚠️  Could not open file manager automatically\n'));
        console.log(chalk.white('Navigate to this path manually:\n'));
        console.log(chalk.cyan(`   ${serverPath}\n`));
      }
    });
  }
  
  // Wait for user acknowledgment
  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: 'Press Enter to continue...'
  }]);
}

async function showServerList() {
  const serversDir = getServersDir();
  await fs.ensureDir(serversDir);
  
  // Read servers
  let servers = [];
  const serverPaths = new Map(); // Store actual paths
  
  try {
    const items = await fs.readdir(serversDir);
    for (const item of items) {
      const itemPath = path.join(serversDir, item);
      const stats = await fs.stat(itemPath);
      
      if (item.endsWith('.link')) {
        // This is a link to a custom location server
        try {
          const linkData = await fs.readJson(itemPath);
          const actualPath = linkData.path;
          
          if (await fs.pathExists(actualPath)) {
            const configPath = path.join(actualPath, 'redstone.json');
            if (await fs.pathExists(configPath)) {
              const config = await fs.readJson(configPath);
              const serverName = linkData.name;
              servers.push({
                name: serverName,
                type: config.type || 'Unknown',
                version: config.version || 'Unknown',
                ram: config.ram || 1024,
                status: 'Stopped' // TODO: Check if actually running
              });
              serverPaths.set(serverName, actualPath);
            }
          }
        } catch (e) {
          // Invalid link file, skip
        }
      } else if (stats.isDirectory()) {
        // Regular server in default location
        const configPath = path.join(itemPath, 'redstone.json');
        if (await fs.pathExists(configPath)) {
          // Check if this server is already in the list (from .link file)
          if (!serverPaths.has(item)) {
            const config = await fs.readJson(configPath);
            servers.push({
              name: item,
              type: config.type || 'Unknown',
              version: config.version || 'Unknown',
              ram: config.ram || 1024,
              status: 'Stopped' // TODO: Check if actually running
            });
            serverPaths.set(item, itemPath);
          }
        }
      }
    }
  } catch (error) {
    await fs.ensureDir(serversDir);
  }
  
  if (servers.length === 0) {
    console.log(chalk.yellow('\n📁 No servers found. Create one first!\n'));
    return;
  }

  // Display table
  console.log(chalk.cyan('\n📋 SERVER LIST\n'));
  console.log(chalk.gray('┌────────────────────┬──────────┬──────────┬──────────┬────────┐'));
  console.log(chalk.gray('│ Name               │ Type     │ Version  │ Status   │ RAM    │'));
  console.log(chalk.gray('├────────────────────┼──────────┼──────────┼──────────┼────────┤'));
  
  servers.forEach(server => {
    const name = server.name.padEnd(18).substring(0, 18);
    const type = server.type.padEnd(8).substring(0, 8);
    const version = server.version.padEnd(8).substring(0, 8);
    const status = server.status.padEnd(8);
    const ram = `${server.ram}M`.padEnd(6);
    console.log(`│ ${name} │ ${type} │ ${version} │ ${status} │ ${ram} │`);
  });
  
  console.log(chalk.gray('└────────────────────┴──────────┴──────────┴──────────┴────────┘\n'));

  // Select server
  const choices = servers.map(s => ({ name: s.name, value: s.name }));
  choices.push({ name: '⬅️  Back to Main Menu', value: 'back' });

  const { serverName } = await inquirer.prompt([{
    type: 'list',
    name: 'serverName',
    message: 'Select a server:',
    choices: choices
  }]);

  if (serverName === 'back') return;

  // Get actual server path
  const actualPath = serverPaths.get(serverName);
  if (!actualPath) {
    console.log(chalk.red('\n❌ Server path not found\n'));
    return;
  }

  // Show server menu
  await showServerMenu(serverName, actualPath);
}

async function showServerMenu(serverName, serverPath) {
  // If serverPath not provided, resolve it
  if (!serverPath) {
    serverPath = await resolveServerPath(serverName);
  }
  
  const config = await fs.readJson(path.join(serverPath, 'redstone.json'));

  console.log(chalk.cyan(`\n🔧 SERVER: ${serverName}\n`));

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: '▶️  Start Server', value: 'start' },
      { name: '⏹️  Stop Server', value: 'stop' },
      { name: '📜 View Logs', value: 'logs' },
      { name: '🌍 World Management', value: 'world' },
      { name: '⚙️  Server Properties', value: 'properties' },
      { name: '📁 Open Files', value: 'files' },
      { name: '🗑️  Delete Server', value: 'delete' },
      { name: '⬅️  Back to List', value: 'back' }
    ]
  }]);

  switch (action) {
    case 'start':
      const { startServer } = require('./start');
      await startServer(serverName);
      break;
    case 'stop':
      await stopServer(serverName, serverPath);
      break;
    case 'logs':
      console.log(chalk.yellow('\n📜 View logs functionality coming soon...\n'));
      break;
    case 'world':
      await worldManagement(serverName, serverPath);
      break;
    case 'properties':
      await manageProperties(serverName, serverPath);
      break;
    case 'files':
      await openServerFiles(serverPath);
      break;
    case 'delete':
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `⚠️  Delete ${serverName}? This cannot be undone!`,
        default: false
      }]);
      if (confirm) {
        // Remove server directory
        await fs.remove(serverPath);
        
        // Also remove link file if it exists
        const linkFile = path.join(getServersDir(), `${serverName}.link`);
        if (await fs.pathExists(linkFile)) {
          await fs.remove(linkFile);
        }
        
        console.log(chalk.green(`\n✅ Server "${serverName}" deleted\n`));
        return;
      }
      break;
    case 'back':
      return;
  }

  // Loop back to server menu
  if (action !== 'back' && action !== 'delete') {
    await showServerMenu(serverName);
  }
}

async function stopServer(serverName, serverPath) {
  console.log(chalk.cyan(`\n⏹️  Stopping ${serverName}...\n`));
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    if (process.platform === 'win32') {
      // Windows - find and kill java processes in this directory
      try {
        const { stdout } = await execPromise(`wmic process where "name='java.exe'" get processid,commandline /format:csv`);
        const lines = stdout.split('\n').filter(line => line.includes(serverPath));
        
        if (lines.length > 0) {
          for (const line of lines) {
            const match = line.match(/,(\d+)$/);
            if (match) {
              const pid = match[1];
              try {
                await execPromise(`taskkill /PID ${pid} /F`);
                console.log(chalk.green(`✅ Stopped process ${pid}`));
              } catch (e) {
                // Process might already be dead
              }
            }
          }
          console.log(chalk.green(`\n✅ Server "${serverName}" stopped\n`));
        } else {
          console.log(chalk.yellow('⚠️  No running server found\n'));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not find running server\n'));
      }
      
      // Also try to kill Playit
      try {
        const { stdout: playitList } = await execPromise(`wmic process where "name='playit-windows.exe' or name='playit.exe'" get processid,commandline /format:csv`);
        const playitLines = playitList.split('\n').filter(line => line.trim() && line.includes('playit'));
        
        for (const line of playitLines) {
          const match = line.match(/,(\d+)$/);
          if (match) {
            const pid = match[1];
            try {
              await execPromise(`taskkill /PID ${pid} /F`);
              console.log(chalk.green(`✅ Stopped Playit tunnel`));
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (e) {
        // Ignore
      }
      
    } else {
      // Linux/Mac - kill screen/tmux session or find java process
      try {
        // Try screen first
        await execPromise('screen -S minecraft -X quit');
        console.log(chalk.green(`\n✅ Server "${serverName}" stopped (screen)\n`));
      } catch (screenError) {
        try {
          // Try tmux
          await execPromise('tmux kill-session -t minecraft');
          console.log(chalk.green(`\n✅ Server "${serverName}" stopped (tmux)\n`));
        } catch (tmuxError) {
          // Try finding java process
          try {
            const { stdout } = await execPromise(`ps aux | grep "java.*${serverPath}" | grep -v grep`);
            const lines = stdout.split('\n').filter(line => line.trim());
            
            if (lines.length > 0) {
              const pid = lines[0].split(/\s+/)[1];
              await execPromise(`kill ${pid}`);
              console.log(chalk.green(`\n✅ Server "${serverName}" stopped\n`));
            } else {
              console.log(chalk.yellow('⚠️  No running server found\n'));
            }
          } catch (e) {
            console.log(chalk.yellow('⚠️  No running server found\n'));
          }
        }
      }
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
}

async function worldManagement(serverName, serverPath) {
  console.log(chalk.cyan(`\n🌍 WORLD MANAGEMENT - ${serverName}\n`));
  
  const worldPath = path.join(serverPath, 'world');
  const worldExists = await fs.pathExists(worldPath);
  
  if (!worldExists) {
    console.log(chalk.yellow('⚠️  No world found yet. Start the server first to generate a world.\n'));
    return;
  }
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'World Management:',
    choices: [
      { name: '💾 Backup World', value: 'backup' },
      { name: '📂 Restore from Backup', value: 'restore' },
      { name: '📤 Export World', value: 'export' },
      { name: '📥 Import World', value: 'import' },
      { name: '🗑️  Delete World', value: 'delete' },
      { name: '⬅️  Back', value: 'back' }
    ]
  }]);
  
  switch (action) {
    case 'backup':
      await backupWorld(serverName, serverPath, worldPath);
      break;
    case 'restore':
      await restoreWorld(serverName, serverPath);
      break;
    case 'export':
      await exportWorld(serverName, worldPath);
      break;
    case 'import':
      await importWorld(serverName, serverPath);
      break;
    case 'delete':
      const { confirmDelete } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmDelete',
        message: '⚠️  Delete world? This cannot be undone!',
        default: false
      }]);
      if (confirmDelete) {
        await fs.remove(worldPath);
        await fs.remove(path.join(serverPath, 'world_nether'));
        await fs.remove(path.join(serverPath, 'world_the_end'));
        console.log(chalk.green('\n✅ World deleted\n'));
      }
      break;
    case 'back':
      return;
  }
  
  if (action !== 'back') {
    await worldManagement(serverName, serverPath);
  }
}

async function backupWorld(serverName, serverPath, worldPath) {
  const ora = require('ora');
  const archiver = require('archiver');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + Date.now();
  const backupDir = path.join(serverPath, 'backups');
  await fs.ensureDir(backupDir);
  
  const backupFile = path.join(backupDir, `world-backup-${timestamp}.zip`);
  const spinner = ora('Creating backup...').start();
  
  try {
    const output = fs.createWriteStream(backupFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      spinner.succeed(chalk.green(`Backup created: ${sizeMB}MB`));
      console.log(chalk.gray(`   Location: ${backupFile}\n`));
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    archive.directory(worldPath, 'world');
    
    // Also backup nether and end if they exist
    const netherPath = path.join(serverPath, 'world_nether');
    const endPath = path.join(serverPath, 'world_the_end');
    
    if (await fs.pathExists(netherPath)) {
      archive.directory(netherPath, 'world_nether');
    }
    if (await fs.pathExists(endPath)) {
      archive.directory(endPath, 'world_the_end');
    }
    
    await archive.finalize();
  } catch (error) {
    spinner.fail('Backup failed');
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
}

async function restoreWorld(serverName, serverPath) {
  const backupDir = path.join(serverPath, 'backups');
  
  if (!await fs.pathExists(backupDir)) {
    console.log(chalk.yellow('\n⚠️  No backups found\n'));
    return;
  }
  
  const backups = (await fs.readdir(backupDir))
    .filter(f => f.endsWith('.zip'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.log(chalk.yellow('\n⚠️  No backups found\n'));
    return;
  }
  
  const choices = backups.map(b => ({ name: b, value: b }));
  choices.push({ name: '⬅️  Cancel', value: 'cancel' });
  
  const { backup } = await inquirer.prompt([{
    type: 'list',
    name: 'backup',
    message: 'Select backup to restore:',
    choices: choices
  }]);
  
  if (backup === 'cancel') return;
  
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: '⚠️  This will replace the current world. Continue?',
    default: false
  }]);
  
  if (!confirm) return;
  
  const ora = require('ora');
  const extract = require('extract-zip');
  const spinner = ora('Restoring backup...').start();
  
  try {
    // Remove current world
    await fs.remove(path.join(serverPath, 'world'));
    await fs.remove(path.join(serverPath, 'world_nether'));
    await fs.remove(path.join(serverPath, 'world_the_end'));
    
    // Extract backup
    const backupFile = path.join(backupDir, backup);
    await extract(backupFile, { dir: serverPath });
    
    spinner.succeed(chalk.green('World restored'));
    console.log(chalk.gray(`   From: ${backup}\n`));
  } catch (error) {
    spinner.fail('Restore failed');
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
}

async function exportWorld(serverName, worldPath) {
  const { exportPath } = await inquirer.prompt([{
    type: 'input',
    name: 'exportPath',
    message: 'Export location (absolute path):',
    default: path.join(os.homedir(), 'Desktop', `${serverName}-world.zip`)
  }]);
  
  const ora = require('ora');
  const archiver = require('archiver');
  const spinner = ora('Exporting world...').start();
  
  try {
    await fs.ensureDir(path.dirname(exportPath));
    
    const output = fs.createWriteStream(exportPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      spinner.succeed(chalk.green(`World exported: ${sizeMB}MB`));
      console.log(chalk.gray(`   Location: ${exportPath}\n`));
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    archive.directory(worldPath, false);
    await archive.finalize();
  } catch (error) {
    spinner.fail('Export failed');
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
}

async function importWorld(serverName, serverPath) {
  const { importPath } = await inquirer.prompt([{
    type: 'input',
    name: 'importPath',
    message: 'World zip file path (absolute path):'
  }]);
  
  if (!await fs.pathExists(importPath)) {
    console.log(chalk.red('\n❌ File not found\n'));
    return;
  }
  
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: '⚠️  This will replace the current world. Continue?',
    default: false
  }]);
  
  if (!confirm) return;
  
  const ora = require('ora');
  const extract = require('extract-zip');
  const spinner = ora('Importing world...').start();
  
  try {
    // Remove current world
    const worldPath = path.join(serverPath, 'world');
    await fs.remove(worldPath);
    
    // Extract to world directory
    await fs.ensureDir(worldPath);
    await extract(importPath, { dir: worldPath });
    
    spinner.succeed(chalk.green('World imported'));
    console.log(chalk.gray(`   From: ${importPath}\n`));
  } catch (error) {
    spinner.fail('Import failed');
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
}

async function manageProperties(serverName, serverPath) {
  const propertiesFile = path.join(serverPath, 'server.properties');
  
  // Create default properties if not exists
  if (!await fs.pathExists(propertiesFile)) {
    await fs.writeFile(propertiesFile, `# Minecraft server properties
server-port=25565
gamemode=survival
difficulty=normal
max-players=20
online-mode=false
white-list=false
pvp=true
spawn-protection=16
view-distance=10
max-world-size=29999984
enable-command-block=false
spawn-animals=true
spawn-monsters=true
spawn-npcs=true
`);
  }
  
  // Read current properties
  const properties = await readProperties(propertiesFile);
  
  console.log(chalk.cyan(`\n⚙️  SERVER PROPERTIES - ${serverName}\n`));
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Select property to edit:',
    choices: [
      { name: `Max Players: ${chalk.yellow(properties['max-players'] || '20')}`, value: 'max-players' },
      { name: `Gamemode: ${chalk.yellow(properties.gamemode || 'survival')}`, value: 'gamemode' },
      { name: `Difficulty: ${chalk.yellow(properties.difficulty || 'normal')}`, value: 'difficulty' },
      { name: `Whitelist: ${chalk.yellow(properties['white-list'] || 'false')}`, value: 'white-list' },
      { name: `PVP: ${chalk.yellow(properties.pvp || 'true')}`, value: 'pvp' },
      { name: `Online Mode: ${chalk.yellow(properties['online-mode'] || 'false')}`, value: 'online-mode' },
      { name: `Spawn Protection: ${chalk.yellow(properties['spawn-protection'] || '16')}`, value: 'spawn-protection' },
      { name: `View Distance: ${chalk.yellow(properties['view-distance'] || '10')}`, value: 'view-distance' },
      { name: `Max World Size: ${chalk.yellow(properties['max-world-size'] || '29999984')}`, value: 'max-world-size' },
      { name: `Command Blocks: ${chalk.yellow(properties['enable-command-block'] || 'false')}`, value: 'enable-command-block' },
      { name: `Spawn Animals: ${chalk.yellow(properties['spawn-animals'] || 'true')}`, value: 'spawn-animals' },
      { name: `Spawn Monsters: ${chalk.yellow(properties['spawn-monsters'] || 'true')}`, value: 'spawn-monsters' },
      new inquirer.Separator(),
      { name: '👑 Manage OPs', value: 'ops' },
      { name: '📝 Manage Whitelist', value: 'whitelist' },
      new inquirer.Separator(),
      { name: '⬅️  Back', value: 'back' }
    ]
  }]);
  
  if (action === 'back') return;
  if (action === 'ops') {
    await manageOPList(serverName, serverPath);
    await manageProperties(serverName, serverPath);
    return;
  }
  if (action === 'whitelist') {
    await manageWhitelist(serverName, serverPath);
    await manageProperties(serverName, serverPath);
    return;
  }
  
  // Edit the selected property
  await editProperty(serverPath, propertiesFile, action, properties);
  
  // Loop back
  await manageProperties(serverName, serverPath);
}

async function readProperties(propertiesFile) {
  const content = await fs.readFile(propertiesFile, 'utf8');
  const properties = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        properties[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return properties;
}

async function writeProperties(propertiesFile, properties) {
  let content = '# Minecraft server properties\n';
  
  for (const [key, value] of Object.entries(properties)) {
    content += `${key}=${value}\n`;
  }
  
  await fs.writeFile(propertiesFile, content);
}

async function editProperty(serverPath, propertiesFile, propertyKey, properties) {
  const currentValue = properties[propertyKey] || '';
  
  let newValue;
  
  // Different input types based on property
  if (propertyKey === 'gamemode') {
    const { value } = await inquirer.prompt([{
      type: 'list',
      name: 'value',
      message: 'Select gamemode:',
      choices: ['survival', 'creative', 'adventure', 'spectator'],
      default: currentValue
    }]);
    newValue = value;
    
  } else if (propertyKey === 'difficulty') {
    const { value } = await inquirer.prompt([{
      type: 'list',
      name: 'value',
      message: 'Select difficulty:',
      choices: ['peaceful', 'easy', 'normal', 'hard'],
      default: currentValue
    }]);
    newValue = value;
    
  } else if (['white-list', 'pvp', 'online-mode', 'enable-command-block', 'spawn-animals', 'spawn-monsters'].includes(propertyKey)) {
    const { value } = await inquirer.prompt([{
      type: 'list',
      name: 'value',
      message: `${propertyKey}:`,
      choices: ['true', 'false'],
      default: currentValue
    }]);
    newValue = value;
    
  } else {
    // Number input
    const { value } = await inquirer.prompt([{
      type: 'input',
      name: 'value',
      message: `${propertyKey}:`,
      default: currentValue,
      validate: input => !isNaN(input) || 'Must be a number'
    }]);
    newValue = value;
  }
  
  // Update properties
  properties[propertyKey] = newValue;
  await writeProperties(propertiesFile, properties);
  
  console.log(chalk.green(`\n✅ ${propertyKey} set to: ${chalk.white(newValue)}\n`));
}

async function manageOPList(serverName, serverPath) {
  const opsFile = path.join(serverPath, 'ops.json');
  
  // Create empty ops file if not exists
  if (!await fs.pathExists(opsFile)) {
    await fs.writeJson(opsFile, []);
  }
  
  let ops = await fs.readJson(opsFile);
  
  console.log(chalk.cyan(`\n👑 OP LIST - ${serverName}\n`));
  
  if (ops.length === 0) {
    console.log(chalk.gray('No operators yet\n'));
  } else {
    console.log(chalk.gray('┌────────────────────┬───────┬─────────────┐'));
    console.log(chalk.gray('│ Username           │ Level │ Bypass Limit│'));
    console.log(chalk.gray('├────────────────────┼───────┼─────────────┤'));
    
    ops.forEach(op => {
      const username = (op.name || 'Unknown').padEnd(18).substring(0, 18);
      const level = String(op.level || 4).padEnd(5);
      const bypass = (op.bypassesPlayerLimit ? 'Yes' : 'No').padEnd(11);
      console.log(`│ ${username} │ ${level} │ ${bypass} │`);
    });
    
    console.log(chalk.gray('└────────────────────┴───────┴─────────────┘\n'));
  }
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Manage operators:',
    choices: [
      { name: '➕ Add OP', value: 'add' },
      { name: '➖ Remove OP', value: 'remove' },
      { name: '⬅️  Back', value: 'back' }
    ]
  }]);
  
  if (action === 'back') return;
  
  if (action === 'add') {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
        validate: input => input.length > 0 || 'Username required'
      },
      {
        type: 'list',
        name: 'level',
        message: 'Permission level:',
        choices: [
          { name: '1 - Bypass spawn protection', value: 1 },
          { name: '2 - Use /clear, /difficulty, /effect, /gamemode, /gamerule, /give, /tp', value: 2 },
          { name: '3 - Use /ban, /deop, /kick, /op', value: 3 },
          { name: '4 - Use /stop (full admin)', value: 4 }
        ],
        default: 4
      },
      {
        type: 'confirm',
        name: 'bypass',
        message: 'Bypass player limit?',
        default: false
      }
    ]);
    
    // Add to ops list
    ops.push({
      uuid: 'offline-uuid-' + Date.now(), // Simplified UUID
      name: answers.username,
      level: answers.level,
      bypassesPlayerLimit: answers.bypass
    });
    
    await fs.writeJson(opsFile, ops, { spaces: 2 });
    console.log(chalk.green(`\n✅ ${answers.username} added as OP\n`));
    
  } else if (action === 'remove') {
    if (ops.length === 0) {
      console.log(chalk.yellow('\n⚠️  No operators to remove\n'));
      return;
    }
    
    const choices = ops.map(op => ({ name: op.name, value: op.name }));
    choices.push({ name: '⬅️  Cancel', value: 'cancel' });
    
    const { username } = await inquirer.prompt([{
      type: 'list',
      name: 'username',
      message: 'Remove OP:',
      choices: choices
    }]);
    
    if (username !== 'cancel') {
      ops = ops.filter(op => op.name !== username);
      await fs.writeJson(opsFile, ops, { spaces: 2 });
      console.log(chalk.green(`\n✅ ${username} removed from OPs\n`));
    }
  }
  
  await manageOPList(serverName, serverPath);
}

async function manageWhitelist(serverName, serverPath) {
  const whitelistFile = path.join(serverPath, 'whitelist.json');
  
  // Create empty whitelist if not exists
  if (!await fs.pathExists(whitelistFile)) {
    await fs.writeJson(whitelistFile, []);
  }
  
  let whitelist = await fs.readJson(whitelistFile);
  
  console.log(chalk.cyan(`\n📝 WHITELIST - ${serverName}\n`));
  
  if (whitelist.length === 0) {
    console.log(chalk.gray('No players whitelisted yet\n'));
  } else {
    console.log(chalk.gray('┌────────────────────┐'));
    console.log(chalk.gray('│ Username           │'));
    console.log(chalk.gray('├────────────────────┤'));
    
    whitelist.forEach(player => {
      const username = (player.name || 'Unknown').padEnd(18).substring(0, 18);
      console.log(`│ ${username} │`);
    });
    
    console.log(chalk.gray('└────────────────────┘\n'));
  }
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Manage whitelist:',
    choices: [
      { name: '➕ Add Player', value: 'add' },
      { name: '➖ Remove Player', value: 'remove' },
      { name: '⬅️  Back', value: 'back' }
    ]
  }]);
  
  if (action === 'back') return;
  
  if (action === 'add') {
    const { username } = await inquirer.prompt([{
      type: 'input',
      name: 'username',
      message: 'Username:',
      validate: input => input.length > 0 || 'Username required'
    }]);
    
    // Add to whitelist
    whitelist.push({
      uuid: 'offline-uuid-' + Date.now(), // Simplified UUID
      name: username
    });
    
    await fs.writeJson(whitelistFile, whitelist, { spaces: 2 });
    console.log(chalk.green(`\n✅ ${username} added to whitelist\n`));
    
  } else if (action === 'remove') {
    if (whitelist.length === 0) {
      console.log(chalk.yellow('\n⚠️  No players to remove\n'));
      return;
    }
    
    const choices = whitelist.map(p => ({ name: p.name, value: p.name }));
    choices.push({ name: '⬅️  Cancel', value: 'cancel' });
    
    const { username } = await inquirer.prompt([{
      type: 'list',
      name: 'username',
      message: 'Remove player:',
      choices: choices
    }]);
    
    if (username !== 'cancel') {
      whitelist = whitelist.filter(p => p.name !== username);
      await fs.writeJson(whitelistFile, whitelist, { spaces: 2 });
      console.log(chalk.green(`\n✅ ${username} removed from whitelist\n`));
    }
  }
  
  await manageWhitelist(serverName, serverPath);
}

module.exports = { showServerList, getServersDir };
