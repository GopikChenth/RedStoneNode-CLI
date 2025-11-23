#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const inquirer = require('inquirer');

// Import commands
const init = require('../src/commands/init');
const start = require('../src/commands/start');
const stop = require('../src/commands/stop');
const list = require('../src/commands/list');
const config = require('../src/commands/config');
const world = require('../src/commands/world');
const tunnel = require('../src/commands/tunnel');

// Clear visible screen
function clearScreen() {
  console.clear();
}

// Display banner
function displayBanner() {
  // Add padding at top
  console.log('');
  
  const banner = figlet.textSync('REDSTONE', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  console.log(chalk.red(banner));
  console.log(chalk.gray('                                          v1.0.0'));
}

// Main menu
async function showMainMenu() {
  clearScreen();
  displayBanner();

  console.log('');
  
  console.log('');

  // Check if ESC was pressed
  if (global.escPressed) {
    global.escPressed = false;
    // Reset terminal formatting before exit
    process.stdout.write('\x1b[0m');
    console.log(chalk.red('\n👋 Goodbye!\n'));
    process.exit(0);
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.red('Select action:'),
      choices: [
        { name: 'Create a Server', value: 'init' },
        { name: 'List Server', value: 'list' },
        { name: 'Exit', value: 'exit' }
      ],
      pageSize: 10
    }
  ]);

  return action;
}

// Main execution
async function main() {
  try {
    const action = await showMainMenu();

    switch (action) {
      case 'init':
        await init.execute();
        break;
      case 'list':
        await list.execute();
        break;
      case 'exit':
        // Reset terminal formatting before exit
        process.stdout.write('\x1b[0m');
        console.log(chalk.red('\n👋 Goodbye!\n'));
        process.exit(0);
        break;
    }

    // Wait for user to see results before returning to menu
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press Enter to return to main menu...')
    }]);
    
    // Reset terminal formatting before returning to menu
    process.stdout.write('\x1b[0m');
    
    // Return to menu
    main();
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
