const chalk = require('chalk');
const inquirer = require('inquirer');
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
  
  console.log(chalk.white('⚙️  Server Configuration\n'));

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

    // Select config option
    const { configOption } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configOption',
        message: 'What would you like to configure?',
        choices: [
          { name: '📝 Edit server.properties', value: 'properties' },
          { name: '👑 Manage operators (ops)', value: 'ops' },
          { name: '📋 Manage whitelist', value: 'whitelist' },
          { name: '⚙️  RedStone config', value: 'redstone' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);

    if (configOption === 'back') return;

    switch (configOption) {
      case 'properties':
        await editServerProperties(selectedServer);
        break;
      case 'ops':
        await manageOps(selectedServer);
        break;
      case 'whitelist':
        await manageWhitelist(selectedServer);
        break;
      case 'redstone':
        await editRedstoneConfig(selectedServer);
        break;
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

async function editServerProperties(serverPath) {
  const propsPath = path.join(serverPath, 'server.properties');
  
  if (!await fs.pathExists(propsPath)) {
    console.log(chalk.yellow('\n⚠️  server.properties not found. Start the server once to generate it.\n'));
    return;
  }

  console.log(chalk.cyan('\n📝 Server Properties:'));
  console.log(chalk.white(propsPath));
  console.log(chalk.yellow('\n💡 Edit this file manually with a text editor.\n'));
}

async function manageOps(serverPath) {
  const opsPath = path.join(serverPath, 'ops.json');
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Operators:',
      choices: [
        { name: 'Add operator', value: 'add' },
        { name: 'Remove operator', value: 'remove' },
        { name: 'List operators', value: 'list' }
      ]
    }
  ]);

  let ops = [];
  if (await fs.pathExists(opsPath)) {
    ops = await fs.readJson(opsPath);
  }

  if (action === 'list') {
    if (ops.length === 0) {
      console.log(chalk.yellow('\n⚠️  No operators configured.\n'));
    } else {
      console.log(chalk.cyan('\n👑 Operators:'));
      ops.forEach(op => console.log(chalk.white(`  - ${op.name} (Level ${op.level})`)));
      console.log('');
    }
  } else if (action === 'add') {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Player username:',
        validate: input => input.trim() !== ''
      }
    ]);

    ops.push({
      uuid: "00000000-0000-0000-0000-000000000000", // Placeholder
      name: username,
      level: 4,
      bypassesPlayerLimit: false
    });

    await fs.writeJson(opsPath, ops, { spaces: 2 });
    console.log(chalk.green(`\n✅ Added ${username} as operator.\n`));
  }
}

async function manageWhitelist(serverPath) {
  const whitelistPath = path.join(serverPath, 'whitelist.json');
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Whitelist:',
      choices: [
        { name: 'Add player', value: 'add' },
        { name: 'Remove player', value: 'remove' },
        { name: 'List players', value: 'list' }
      ]
    }
  ]);

  let whitelist = [];
  if (await fs.pathExists(whitelistPath)) {
    whitelist = await fs.readJson(whitelistPath);
  }

  if (action === 'list') {
    if (whitelist.length === 0) {
      console.log(chalk.yellow('\n⚠️  Whitelist is empty.\n'));
    } else {
      console.log(chalk.cyan('\n📋 Whitelisted Players:'));
      whitelist.forEach(player => console.log(chalk.white(`  - ${player.name}`)));
      console.log('');
    }
  } else if (action === 'add') {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Player username:',
        validate: input => input.trim() !== ''
      }
    ]);

    whitelist.push({
      uuid: "00000000-0000-0000-0000-000000000000", // Placeholder
      name: username
    });

    await fs.writeJson(whitelistPath, whitelist, { spaces: 2 });
    console.log(chalk.green(`\n✅ Added ${username} to whitelist.\n`));
  }
}

async function editRedstoneConfig(serverPath) {
  const configPath = path.join(serverPath, '.redstone', 'config.json');
  const config = await fs.readJson(configPath);

  console.log(chalk.cyan('\n⚙️  RedStone Configuration:'));
  console.log(JSON.stringify(config, null, 2));
  console.log(chalk.yellow('\n💡 Edit manually at:'), chalk.white(configPath + '\n'));
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
