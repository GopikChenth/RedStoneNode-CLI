const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const javaDetector = require('../utils/java-detector');
const jarManager = require('../utils/jar-manager');

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
  
  console.log(chalk.red('🚀 Initialize New Minecraft Server\n'));

  try {
    // Check for Java installation
    const spinner = ora('Checking Java installation...').start();
    const javaInfo = await javaDetector.detect();
    
    if (!javaInfo.found) {
      spinner.fail(chalk.red('Java not found!'));
      console.log(chalk.yellow('\n⚠️  Java is required to run Minecraft servers.'));
      
      if (process.platform === 'android' || process.env.PREFIX?.includes('com.termux')) {
        console.log(chalk.cyan('\nInstall Java in Termux:'));
        console.log(chalk.white('  pkg install openjdk-17\n'));
      } else {
        console.log(chalk.cyan('\nDownload Java from: https://adoptium.net/\n'));
      }
      return;
    }
    
    spinner.succeed(chalk.green(`Java found: ${javaInfo.version}`));

    // Prompt for server configuration
    // Get safe default path (avoid System32 and other restricted directories)
    let defaultPath = process.cwd();
    const isRestrictedPath = defaultPath.includes('System32') || 
                            defaultPath.includes('Windows') || 
                            defaultPath.includes('Program Files');
    
    if (isRestrictedPath) {
      // Use home directory instead
      defaultPath = process.env.HOME || process.env.USERPROFILE || process.cwd();
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverName',
        message: 'Server name:',
        default: 'my-minecraft-server',
        validate: (input) => {
          if (input.match(/^[a-zA-Z0-9-_]+$/)) return true;
          return 'Server name can only contain letters, numbers, hyphens, and underscores';
        }
      },
      {
        type: 'input',
        name: 'serverPath',
        message: 'Server directory:',
        default: defaultPath,
        validate: (input) => {
          if (!input.trim()) return 'Path cannot be empty';
          
          // Check for restricted paths
          const restricted = input.includes('System32') || 
                           input.includes('Windows') || 
                           input.includes('Program Files');
          
          if (restricted) {
            return 'Cannot create server in system directories. Use your home directory instead.';
          }
          
          return true;
        }
      },
      {
        type: 'list',
        name: 'serverType',
        message: 'Server type:',
        choices: [
          { name: '⭐ Vanilla (Official Mojang)', value: 'vanilla' },
          { name: '📄 PaperMC (Optimized)', value: 'papermc' },
          { name: '🔧 Spigot', value: 'spigot' },
          { name: '🧵 Fabric', value: 'fabric' },
          { name: '⚒️  Forge', value: 'forge' }
        ],
        default: 'vanilla'
      },
      {
        type: 'list',
        name: 'minecraftVersion',
        message: 'Minecraft version:',
        choices: [
          '1.21.4', '1.21.3', '1.21.1', '1.21',
          '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20',
          '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
          '1.18.2', '1.18.1', '1.18',
          '1.17.1', '1.17',
          '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1',
          '1.15.2', '1.15.1', '1.15',
          '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
          '1.13.2', '1.13.1', '1.13',
          '1.12.2', '1.12.1', '1.12'
        ],
        default: '1.20.1',
        pageSize: 15
      },
      {
        type: 'number',
        name: 'ramAllocation',
        message: 'RAM allocation (GB):',
        default: process.platform === 'android' || process.env.PREFIX?.includes('com.termux') ? 3 : 4,
        validate: (input) => {
          if (input > 0 && input <= 32) return true;
          return 'Please enter a value between 1 and 32 GB';
        }
      },
      {
        type: 'number',
        name: 'port',
        message: 'Server port:',
        default: 25565,
        validate: (input) => {
          if (input >= 1024 && input <= 65535) return true;
          return 'Please enter a port between 1024 and 65535';
        }
      }
    ]);

    // Check Java version compatibility
    const javaVersion = parseInt(javaInfo.version.split('.')[0]);
    const mcVersion = answers.minecraftVersion;
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
      console.log(chalk.green.bold(`https://adoptium.net/temurin/releases/?version=${requiredJava}\n`));
      
      const { continueAnyway } = await inquirer.prompt([{
        type: 'confirm',
        name: 'continueAnyway',
        message: 'Continue anyway? (Server may not start)',
        default: false
      }]);
      
      if (!continueAnyway) return;
    } else if (javaVersion > requiredJava) {
      console.log(chalk.yellow(`\n💡 Note: Minecraft ${mcVersion} recommends Java ${requiredJava}, you have Java ${javaVersion}\n`));
    }

    // Create server directory structure
    const serverDir = path.join(answers.serverPath, answers.serverName);
    const configDir = path.join(serverDir, '.redstone');

    const createSpinner = ora('Creating server directory...').start();
    await fs.ensureDir(serverDir);
    await fs.ensureDir(configDir);
    createSpinner.succeed(chalk.green('Server directory created'));

    // Save configuration
    const config = {
      serverName: answers.serverName,
      serverType: answers.serverType,
      minecraftVersion: answers.minecraftVersion,
      javaPath: javaInfo.path,
      javaVersion: javaInfo.version,
      ramAllocation: `${answers.ramAllocation}G`,
      port: answers.port,
      autoBackup: false,
      createdAt: new Date().toISOString()
    };

    await fs.writeJson(path.join(configDir, 'config.json'), config, { spaces: 2 });

    // Download server JAR
    const downloadSpinner = ora('Downloading server JAR...').start();
    try {
      await jarManager.download(answers.serverType, answers.minecraftVersion, serverDir);
      downloadSpinner.succeed(chalk.green('Server JAR downloaded'));
    } catch (error) {
      downloadSpinner.fail(chalk.red('Failed to download server JAR'));
      console.log(chalk.yellow(`\n⚠️  ${error.message}`));
      console.log(chalk.cyan('\nYou can manually place the server JAR in:'));
      console.log(chalk.white(`  ${serverDir}\n`));
    }

    // Accept EULA
    const eulaPath = path.join(serverDir, 'eula.txt');
    await fs.writeFile(eulaPath, 'eula=true\n');

    console.log(chalk.green('\n✅ Server initialized successfully!\n'));
    console.log(chalk.cyan('Server location:'), chalk.white(serverDir));
    console.log(chalk.cyan('Configuration:'), chalk.white(path.join(configDir, 'config.json')));
    console.log(chalk.yellow('\n💡 Use "Start server" to launch your server.\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Initialization failed:'), error.message);
  }
}

module.exports = { execute };
