#!/usr/bin/env node

const readline = require('readline');

// Just run the app - Windows doesn't reliably support alternate screen buffer
// It works perfectly on Linux/Termux/macOS with the ANSI codes below
if (process.platform !== 'win32') {
  // Enter alternate screen buffer on Unix-like systems
  process.stdout.write('\x1b[?1049h');
  
  const exitHandler = () => {
    process.stdout.write('\x1b[?1049l');
    process.stdout.write('\x1b[0m'); // Reset all formatting
  };
  
  process.on('exit', exitHandler);
  process.on('SIGINT', () => { exitHandler(); process.exit(0); });
  process.on('SIGTERM', () => { exitHandler(); process.exit(0); });
}

// Setup ESC key handler
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

global.escPressed = false;

process.stdin.on('keypress', (str, key) => {
  if (key && key.name === 'escape') {
    global.escPressed = true;
  }
  
  // Still allow Ctrl+C to exit
  if (key && key.ctrl && key.name === 'c') {
    process.exit(0);
  }
});

// Run the app
require('./redstonenode-app.js');
