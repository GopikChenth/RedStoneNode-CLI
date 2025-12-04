/**
 * Main Menu - Simple and Fast
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { listServers } = require('../commands/list');
const { createServer } = require('../commands/create');
const { startServer } = require('../commands/start');

async function showMainMenu() {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: '🎮 Start Server', value: 'start' },
      { name: '📋 List Servers', value: 'list' },
      { name: '➕ Create New Server', value: 'create' },
      { name: '❌ Exit', value: 'exit' }
    ]
  }]);

  switch (action) {
    case 'start':
      await startServer();
      break;
    case 'list':
      await listServers();
      break;
    case 'create':
      await createServer();
      break;
    case 'exit':
      console.log(chalk.green('\n👋 Goodbye!\n'));
      process.exit(0);
  }

  // Loop back to menu
  await showMainMenu();
}

module.exports = { showMainMenu };
