/**
 * RedStone CLI v2.0 - Main Entry Point
 * Lightweight Minecraft server manager
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { showMainMenu } = require('./cli/menu');

// ASCII Banner
console.clear();
console.log(chalk.red(`
╦═╗╔═╗╔╦╗╔═╗╔╦╗╔═╗╔╗╔╔═╗  ╔═╗╦  ╦
╠╦╝║╣  ║║╚═╗ ║ ║ ║║║║║╣   ║  ║  ║
╩╚═╚═╝═╩╝╚═╝ ╩ ╚═╝╝╚╝╚═╝  ╚═╝╩═╝╩
`));
console.log(chalk.gray('v2.0 - Fast & Efficient Minecraft Server Manager\n'));

// Start
showMainMenu();
