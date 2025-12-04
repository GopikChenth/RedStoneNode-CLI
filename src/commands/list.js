/**
 * List Command - Show all servers
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Get servers directory
const getServersDir = () => {
  return path.join(os.homedir(), '.redstone', 'servers');
};

async function listServers() {
  const serversDir = getServersDir();
  
  // Ensure directory exists
  await fs.ensureDir(serversDir);
  
  // Read servers
  let servers = [];
  try {
    const items = await fs.readdir(serversDir);
    // Filter only directories
    for (const item of items) {
      const itemPath = path.join(serversDir, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        servers.push(item);
      }
    }
  } catch (error) {
    // Directory doesn't exist or other error
    await fs.ensureDir(serversDir);
  }
  
  if (servers.length === 0) {
    console.log(chalk.yellow('\n📁 No servers found. Create one first!\n'));
    return;
  }

  console.log(chalk.cyan('\n📋 Your Servers:\n'));
  servers.forEach((server, index) => {
    console.log(`  ${index + 1}. ${chalk.green(server)}`);
  });
  console.log('');
}

module.exports = { listServers, getServersDir };
