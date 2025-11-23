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
  
  console.log(chalk.yellow('⏹️  Stop Minecraft Server\n'));

  try {
    // Find running servers
    const servers = await findRunningServers(process.cwd());

    if (servers.length === 0) {
      console.log(chalk.yellow('⚠️  No running servers found.\n'));
      return;
    }

    // Select server to stop
    const { selectedServer } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedServer',
        message: 'Select server to stop:',
        choices: servers.map(s => ({ name: `${s.name} (PID: ${s.pid})`, value: s }))
      }
    ]);

    const spinner = ora('Stopping server...').start();

    try {
      // Find and kill the Java process
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        
        // Find all Java processes running the server
        try {
          // Kill all java.exe processes that have the server jar in their command line
          const serverDir = selectedServer.path.replace(/\\/g, '\\\\');
          execSync(`powershell "Get-Process java -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.CommandLine -like '*${serverDir}*' } | Stop-Process -Force"`, { 
            stdio: 'ignore',
            timeout: 5000 
          });
        } catch (e) {
          // If PowerShell method fails, try taskkill with the PID (which might be cmd.exe)
          // This will also kill child processes
          execSync(`taskkill /PID ${selectedServer.pid} /F /T`, { stdio: 'ignore' });
        }
      } else {
        process.kill(selectedServer.pid, 'SIGTERM');
      }

      // Wait a moment for process to terminate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove PID file
      const pidPath = path.join(selectedServer.path, '.redstone', 'server.pid');
      await fs.remove(pidPath);

      spinner.succeed(chalk.green('Server stopped successfully!'));
      console.log(chalk.white(`\n✅ ${selectedServer.name} has been stopped.\n`));

    } catch (error) {
      spinner.fail(chalk.red('Failed to stop server'));
      
      // Try to clean up PID file anyway
      const pidPath = path.join(selectedServer.path, '.redstone', 'server.pid');
      if (await fs.pathExists(pidPath)) {
        await fs.remove(pidPath);
      }
      
      console.log(chalk.yellow(`\n⚠️  ${error.message}`));
      console.log(chalk.cyan('💡 The server process may have already stopped.\n'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

async function findRunningServers(dir) {
  const servers = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      const pidPath = path.join(itemPath, '.redstone', 'server.pid');
      const configPath = path.join(itemPath, '.redstone', 'config.json');

      if (await fs.pathExists(pidPath) && await fs.pathExists(configPath)) {
        const pid = parseInt(await fs.readFile(pidPath, 'utf-8'));
        const config = await fs.readJson(configPath);

        // Verify process is actually running
        if (isProcessRunning(pid)) {
          servers.push({
            name: config.serverName,
            path: itemPath,
            pid: pid
          });
        } else {
          // Clean up stale PID file
          await fs.remove(pidPath);
        }
      }
    }
  }

  return servers;
}

function isProcessRunning(pid) {
  try {
    if (process.platform === 'win32') {
      require('child_process').execSync(`tasklist /FI "PID eq ${pid}"`, { stdio: 'ignore' });
      return true;
    } else {
      process.kill(pid, 0);
      return true;
    }
  } catch {
    return false;
  }
}

module.exports = { execute };
