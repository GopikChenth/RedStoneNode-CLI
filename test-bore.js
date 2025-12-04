// Test script to verify Bore tunnel functionality
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');

async function testBore() {
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.cyan('BORE TUNNEL TEST'));
  console.log(chalk.cyan('='.repeat(60)));
  
  const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  const isAndroid = process.platform === 'android' || isTermux;
  
  console.log(chalk.white(`\n📋 Platform: ${process.platform}`));
  console.log(chalk.white(`📋 Android/Termux: ${isAndroid}`));
  
  const boreDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'bore');
  await fs.ensureDir(boreDir);
  
  let boreCommand;
  let boreAvailable = false;
  
  console.log(chalk.cyan('\n🔍 Checking for Bore installation...'));
  
  // Check if bore is in PATH
  try {
    execSync('bore --version', { stdio: 'pipe' });
    boreCommand = 'bore';
    boreAvailable = true;
    console.log(chalk.green('✅ Bore found in PATH'));
    
    const version = execSync('bore --version', { encoding: 'utf8' });
    console.log(chalk.gray(`   Version: ${version.trim()}`));
  } catch (e) {
    console.log(chalk.yellow('⚠️  Bore not found in PATH'));
  }
  
  // Check for downloaded binary on Windows
  if (process.platform === 'win32' && !boreAvailable) {
    const boreExe = path.join(boreDir, 'bore.exe');
    if (await fs.pathExists(boreExe)) {
      boreCommand = boreExe;
      boreAvailable = true;
      console.log(chalk.green('✅ Bore binary found'));
      console.log(chalk.gray(`   Location: ${boreExe}`));
    } else {
      console.log(chalk.yellow('⚠️  Bore binary not found'));
      console.log(chalk.gray(`   Expected: ${boreExe}`));
    }
  }
  
  if (!boreAvailable) {
    console.log(chalk.red('\n❌ Bore is not available!'));
    console.log(chalk.cyan('\n💡 Installation options:'));
    
    if (isAndroid) {
      console.log(chalk.white('  pkg install rust -y'));
      console.log(chalk.white('  cargo install bore-cli'));
    } else if (process.platform === 'win32') {
      console.log(chalk.white('  Download from: https://github.com/ekzhang/bore/releases'));
      console.log(chalk.white(`  Save to: ${boreDir}\\bore.exe`));
    } else {
      console.log(chalk.white('  cargo install bore-cli'));
    }
    
    process.exit(1);
  }
  
  console.log(chalk.cyan('\n🚀 Testing Bore tunnel connection...'));
  console.log(chalk.white('   Port: 25565'));
  console.log(chalk.white('   Server: bore.pub'));
  
  const boreProcess = spawn(boreCommand, 
    ['local', '25565', '--to', 'bore.pub'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isAndroid
    }
  );
  
  let tunnelUrl = '';
  let hasOutput = false;
  
  const timeout = setTimeout(() => {
    if (!tunnelUrl) {
      console.log(chalk.red('\n❌ Timeout waiting for tunnel (15 seconds)'));
      console.log(chalk.yellow('\n💡 This could mean:'));
      console.log(chalk.white('  • bore.pub server is down'));
      console.log(chalk.white('  • Network connectivity issues'));
      console.log(chalk.white('  • Firewall blocking the connection'));
      boreProcess.kill();
      process.exit(1);
    }
  }, 15000);
  
  boreProcess.stdout.on('data', (data) => {
    const output = data.toString();
    hasOutput = true;
    console.log(chalk.gray('\n[STDOUT] ') + output.trim());
    
    const urlMatch = output.match(/listening at (bore\.pub:\d+)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      clearTimeout(timeout);
      
      console.log(chalk.green('\n✅ SUCCESS! Bore tunnel established'));
      console.log(chalk.cyan('\n🌐 Your Public Address:'));
      console.log(chalk.white.bold(`   ${tunnelUrl}`));
      console.log(chalk.gray('\n📋 This URL can be used to connect to your Minecraft server'));
      console.log(chalk.yellow('\n⚠️  Press Ctrl+C to stop the tunnel'));
    }
  });
  
  boreProcess.stderr.on('data', (data) => {
    const output = data.toString();
    hasOutput = true;
    console.log(chalk.gray('\n[STDERR] ') + output.trim());
    
    const urlMatch = output.match(/listening at (bore\.pub:\d+)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      clearTimeout(timeout);
      
      console.log(chalk.green('\n✅ SUCCESS! Bore tunnel established'));
      console.log(chalk.cyan('\n🌐 Your Public Address:'));
      console.log(chalk.white.bold(`   ${tunnelUrl}`));
      console.log(chalk.gray('\n📋 This URL can be used to connect to your Minecraft server'));
      console.log(chalk.yellow('\n⚠️  Press Ctrl+C to stop the tunnel'));
    }
  });
  
  boreProcess.on('error', (error) => {
    clearTimeout(timeout);
    console.log(chalk.red('\n❌ Failed to start Bore process'));
    console.log(chalk.red(`   Error: ${error.message}`));
    process.exit(1);
  });
  
  boreProcess.on('exit', (code, signal) => {
    if (code !== 0 && !tunnelUrl) {
      clearTimeout(timeout);
      console.log(chalk.red(`\n❌ Bore process exited with code ${code}`));
      if (signal) console.log(chalk.red(`   Signal: ${signal}`));
      if (!hasOutput) {
        console.log(chalk.yellow('\n💡 No output was captured. This might indicate:'));
        console.log(chalk.white('  • Bore binary is corrupted'));
        console.log(chalk.white('  • Incompatible binary version'));
        console.log(chalk.white('  • Missing dependencies'));
      }
      process.exit(1);
    }
  });
}

testBore().catch((error) => {
  console.error(chalk.red('\n❌ Test failed:'), error.message);
  process.exit(1);
});
