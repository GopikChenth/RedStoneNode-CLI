/**
 * Create Command - Setup new server
 */

const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const os = require('os');
const { getServersDir } = require('./list');

// Get location choices based on platform
async function getLocationChoices() {
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  if (isTermux) {
    // Check if storage is set up
    const storageSetup = await fs.pathExists('/storage/emulated/0');
    
    if (storageSetup) {
      return [
        { name: '📁 Shared Storage (Recommended) - /storage/emulated/0/Documents/RedStone-Servers', value: 'shared' },
        { name: '🏠 Termux Home - ~/.redstone/servers', value: 'default' },
        { name: '📂 Custom directory', value: 'custom' }
      ];
    } else {
      return [
        { name: '🏠 Termux Home - ~/.redstone/servers', value: 'default' },
        { name: '📁 Shared Storage - /storage/emulated/0/Documents/RedStone-Servers', value: 'shared' },
        { name: '📂 Custom directory', value: 'custom' }
      ];
    }
  }
  
  // Windows/Linux/Mac
  return [
    { name: '📁 Default - ~/.redstone/servers', value: 'default' },
    { name: '📂 Custom directory', value: 'custom' }
  ];
}

async function createServer() {
  console.log(chalk.cyan('\n📦 Create New Minecraft Server\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Server name:',
      default: 'my-server',
      validate: input => input.length > 0 || 'Name cannot be empty'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Server type:',
      choices: ['Vanilla', 'Paper', 'Fabric', 'Forge']
    },
    {
      type: 'list',
      name: 'version',
      message: 'Minecraft version:',
      choices: [
        '1.21.4',
        '1.21.3',
        '1.21.1',
        '1.20.6',
        '1.20.4',
        '1.20.1',
        '1.19.4',
        '1.19.2',
        '1.18.2',
        '1.17.1',
        '1.16.5',
        '1.15.2',
        '1.14.4',
        '1.13.2',
        '1.12.2'
      ]
    },
    {
      type: 'input',
      name: 'ram',
      message: `RAM (GB) [Available: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB]:`,
      default: '1',
      validate: input => !isNaN(input) || 'Must be a number'
    },
    {
      type: 'list',
      name: 'locationChoice',
      message: 'Server location:',
      choices: await getLocationChoices()
    }
  ]);

  let serverPath;
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  
  if (answers.locationChoice === 'shared') {
    // Shared storage for Android/Termux
    const sharedBase = '/storage/emulated/0/Documents/RedStone-Servers';
    serverPath = path.join(sharedBase, answers.name);
    
    // Ensure Documents directory exists
    await fs.ensureDir('/storage/emulated/0/Documents');
    
  } else if (answers.locationChoice === 'custom') {
    const defaultCustom = isTermux 
      ? path.join('/storage/emulated/0', answers.name)
      : path.join(require('os').homedir(), 'Desktop', answers.name);
    
    const { customPath } = await inquirer.prompt([{
      type: 'input',
      name: 'customPath',
      message: 'Enter custom directory path:',
      default: defaultCustom,
      validate: input => {
        if (!input || input.trim().length === 0) {
          return 'Path cannot be empty';
        }
        try {
          // Check if path is valid
          path.parse(input);
          return true;
        } catch (e) {
          return 'Invalid path';
        }
      }
    }]);
    serverPath = customPath;
  } else {
    // Default location - use getServersDir() which handles the actual default
    serverPath = path.join(getServersDir(), answers.name);
  }
  
  // Check if exists
  if (await fs.pathExists(serverPath)) {
    console.log(chalk.red('\n❌ Server already exists!\n'));
    return;
  }

  // Create directory
  await fs.ensureDir(serverPath);

  // Download server JAR
  const spinner = ora('Downloading server...').start();
  
  try {
    await downloadServerJar(answers.type, answers.version, serverPath);
    spinner.succeed('Server downloaded!');

    // Create eula.txt
    await fs.writeFile(path.join(serverPath, 'eula.txt'), 'eula=true');

    // Create server.properties
    await fs.writeFile(
      path.join(serverPath, 'server.properties'),
      `server-port=25565\nonline-mode=false\nmax-players=20\n`
    );

    // Save config
    await fs.writeJson(path.join(serverPath, 'redstone.json'), {
      name: answers.name,
      type: answers.type,
      version: answers.version,
      ram: parseInt(answers.ram) * 1024, // Convert GB to MB
      path: serverPath,
      locationType: answers.locationChoice,
      isCustomLocation: answers.locationChoice !== 'default',
      created: new Date().toISOString()
    });

    // Only create .link file if server is NOT in the default directory
    const defaultServersDir = getServersDir();
    const isInDefaultDir = serverPath.startsWith(defaultServersDir);
    
    if (!isInDefaultDir && (answers.locationChoice === 'custom' || answers.locationChoice === 'shared')) {
      await fs.ensureDir(defaultServersDir);
      const linkFile = path.join(defaultServersDir, `${answers.name}.link`);
      await fs.writeJson(linkFile, {
        name: answers.name,
        path: serverPath,
        created: new Date().toISOString()
      });
    }

    console.log(chalk.green(`\n✅ Server "${answers.name}" created successfully!`));
    console.log(chalk.cyan('\n📁 Server Location:'));
    console.log(chalk.white(`   ${serverPath}`));
    
    // Show how to access files
    const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
    if (isTermux) {
      console.log(chalk.gray('\n   Access files with: cd "' + serverPath + '"'));
    }
    console.log('');
  } catch (error) {
    spinner.fail('Download failed');
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    await fs.remove(serverPath);
  }
}

async function downloadServerJar(type, version, serverPath) {
  let url;
  let filename = 'server.jar';

  switch (type) {
    case 'Vanilla':
      // Fetch version manifest to get correct download URL
      const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
      const manifestResponse = await axios.get(manifestUrl);
      const versionData = manifestResponse.data.versions.find(v => v.id === version);
      
      if (!versionData) {
        throw new Error(`Version ${version} not found in Mojang manifest`);
      }
      
      // Get version JSON with download URL
      const versionJsonResponse = await axios.get(versionData.url);
      url = versionJsonResponse.data.downloads.server.url;
      break;
    
    case 'Paper':
      // PaperMC API
      url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/latest/downloads/paper-${version}-latest.jar`;
      break;
    
    case 'Fabric':
      // Fabric installer
      url = `https://meta.fabricmc.net/v2/versions/loader/${version}/0.15.11/1.0.1/server/jar`;
      break;
    
    case 'Forge':
      // Forge installer - simplified
      console.log(chalk.yellow('\n⚠️  Forge requires manual installation. Downloading installer...\n'));
      url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-latest/forge-${version}-latest-installer.jar`;
      filename = 'forge-installer.jar';
      break;
  }

  // Download with axios
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(path.join(serverPath, filename));
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports = { createServer };
