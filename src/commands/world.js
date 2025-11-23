const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
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
  
  console.log(chalk.magenta('🌍 World Management\n'));

  try {
    // Find servers
    const servers = await findServers(process.cwd());

    if (servers.length === 0) {
      console.log(chalk.yellow('⚠️  No servers found.\n'));
      return;
    }

    // Select server
    const { selectedServer } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedServer',
        message: 'Select server:',
        choices: servers.map(s => ({ name: s.name, value: s.path }))
      }
    ]);

    // Select world action
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'World actions:',
        choices: [
          { name: '➕ Create new world', value: 'create' },
          { name: '📋 List worlds', value: 'list' },
          { name: '🔄 Switch world', value: 'switch' },
          { name: '🗑️  Delete world', value: 'delete' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    switch (action) {
      case 'create':
        await createWorld(selectedServer);
        break;
      case 'list':
        await listWorlds(selectedServer);
        break;
      case 'switch':
        await switchWorld(selectedServer);
        break;
      case 'delete':
        await deleteWorld(selectedServer);
        break;
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

async function createWorld(serverPath) {
  const { worldName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'worldName',
      message: 'World name:',
      default: 'world',
      validate: input => {
        if (input.match(/^[a-zA-Z0-9-_]+$/)) return true;
        return 'World name can only contain letters, numbers, hyphens, and underscores';
      }
    }
  ]);

  const worldPath = path.join(serverPath, worldName);

  if (await fs.pathExists(worldPath)) {
    console.log(chalk.yellow(`\n⚠️  World "${worldName}" already exists.\n`));
    return;
  }

  const spinner = ora('Creating world...').start();
  await fs.ensureDir(worldPath);
  spinner.succeed(chalk.green(`World "${worldName}" created!`));

  console.log(chalk.cyan('\n💡 Start the server to generate world files.\n'));
}

async function listWorlds(serverPath) {
  const worlds = await getWorlds(serverPath);

  if (worlds.length === 0) {
    console.log(chalk.yellow('\n⚠️  No worlds found.\n'));
    return;
  }

  console.log(chalk.cyan('\n🌍 Worlds:'));
  for (const world of worlds) {
    const size = await getFolderSize(world.path);
    console.log(chalk.white(`  - ${world.name} (${formatBytes(size)})`));
  }
  console.log('');
}

async function switchWorld(serverPath) {
  const worlds = await getWorlds(serverPath);

  if (worlds.length === 0) {
    console.log(chalk.yellow('\n⚠️  No worlds found.\n'));
    return;
  }

  const { worldName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'worldName',
      message: 'Switch to world:',
      choices: worlds.map(w => w.name)
    }
  ]);

  // Update server.properties
  const propsPath = path.join(serverPath, 'server.properties');
  
  if (await fs.pathExists(propsPath)) {
    let props = await fs.readFile(propsPath, 'utf-8');
    props = props.replace(/level-name=.*/g, `level-name=${worldName}`);
    await fs.writeFile(propsPath, props);
    
    console.log(chalk.green(`\n✅ Switched to world "${worldName}".`));
    console.log(chalk.cyan('💡 Restart the server for changes to take effect.\n'));
  } else {
    console.log(chalk.yellow('\n⚠️  server.properties not found. Start the server first.\n'));
  }
}

async function deleteWorld(serverPath) {
  const worlds = await getWorlds(serverPath);

  if (worlds.length === 0) {
    console.log(chalk.yellow('\n⚠️  No worlds found.\n'));
    return;
  }

  const { worldName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'worldName',
      message: 'Delete world:',
      choices: worlds.map(w => w.name)
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red(`Are you sure you want to delete "${worldName}"? This cannot be undone!`),
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\n⚠️  Deletion cancelled.\n'));
    return;
  }

  const spinner = ora('Deleting world...').start();
  const worldPath = path.join(serverPath, worldName);
  await fs.remove(worldPath);
  spinner.succeed(chalk.green(`World "${worldName}" deleted!`));
  console.log('');
}

async function getWorlds(serverPath) {
  const worlds = [];
  const items = await fs.readdir(serverPath);

  for (const item of items) {
    const itemPath = path.join(serverPath, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory() && !item.startsWith('.')) {
      // Check if it's a world folder (has level.dat)
      const levelDat = path.join(itemPath, 'level.dat');
      if (await fs.pathExists(levelDat)) {
        worlds.push({
          name: item,
          path: itemPath
        });
      }
    }
  }

  return worlds;
}

async function getFolderSize(folderPath) {
  let size = 0;
  
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        size += await getFolderSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

module.exports = { execute };
