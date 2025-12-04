// Test Cloudflared tunnel
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function testCloudflared() {
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.cyan('CLOUDFLARED TUNNEL TEST'));
  console.log(chalk.cyan('='.repeat(60)));
  
  const cfDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone', 'cloudflared');
  await fs.ensureDir(cfDir);
  
  let cfExe;
  let cfAvailable = false;
  
  if (process.platform === 'win32') {
    cfExe = path.join(cfDir, 'cloudflared.exe');
    
    console.log(chalk.cyan('\n🔍 Checking for Cloudflared...'));
    
    if (await fs.pathExists(cfExe)) {
      console.log(chalk.green('✅ Cloudflared found'));
      cfAvailable = true;
    } else {
      console.log(chalk.yellow('⚠️  Cloudflared not found, downloading...'));
      
      try {
        const downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
        console.log(chalk.gray(`   Downloading from: ${downloadUrl}`));
        
        await downloadFile(downloadUrl, cfExe);
        
        if (await fs.pathExists(cfExe)) {
          const stats = await fs.stat(cfExe);
          console.log(chalk.green('✅ Downloaded successfully'));
          console.log(chalk.gray(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
          cfAvailable = true;
        } else {
          throw new Error('Download completed but file not found');
        }
      } catch (error) {
        console.log(chalk.red(`❌ Download failed: ${error.message}`));
        process.exit(1);
      }
    }
  } else {
    try {
      execSync('cloudflared version', { stdio: 'ignore' });
      cfExe = 'cloudflared';
      cfAvailable = true;
      console.log(chalk.green('✅ Cloudflared found in PATH'));
    } catch {
      console.log(chalk.red('❌ Cloudflared not installed'));
      console.log(chalk.cyan('\nInstall cloudflared:'));
      console.log(chalk.white('  Linux: wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'));
      console.log(chalk.white('  Termux: pkg install cloudflared'));
      process.exit(1);
    }
  }
  
  if (!cfAvailable) {
    console.log(chalk.red('❌ Cloudflared not available'));
    process.exit(1);
  }
  
  console.log(chalk.cyan('\n🚀 Starting Cloudflared tunnel...'));
  console.log(chalk.yellow('⚠️  This will create a quick tunnel (no account needed)'));
  console.log(chalk.gray('   Port: 25565'));
  
  const cfProcess = spawn(cfExe,
    ['tunnel', '--url', 'tcp://localhost:25565'],
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  
  let tunnelUrl = '';
  let hasOutput = false;
  
  const timeout = setTimeout(() => {
    if (!tunnelUrl) {
      console.log(chalk.red('\n❌ Timeout (20 seconds)'));
      cfProcess.kill();
      process.exit(1);
    }
  }, 20000);
  
  cfProcess.stdout.on('data', (data) => {
    const output = data.toString();
    hasOutput = true;
    console.log(chalk.gray('[STDOUT] ') + output.trim());
    
    const urlMatch = output.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      clearTimeout(timeout);
      
      console.log(chalk.green('\n✅ SUCCESS! Cloudflared tunnel established'));
      console.log(chalk.cyan('\n🌐 Your Public Address:'));
      console.log(chalk.white.bold(`   ${tunnelUrl}`));
      console.log(chalk.yellow('\n⚠️  Note: Use the hostname (without https://) in Minecraft'));
      console.log(chalk.white(`   Minecraft address: ${tunnelUrl.replace('https://', '')}`));
      console.log(chalk.yellow('\n⚠️  Press Ctrl+C to stop'));
    }
  });
  
  cfProcess.stderr.on('data', (data) => {
    const output = data.toString();
    hasOutput = true;
    console.log(chalk.gray('[STDERR] ') + output.trim());
    
    const urlMatch = output.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      clearTimeout(timeout);
      
      console.log(chalk.green('\n✅ SUCCESS! Cloudflared tunnel established'));
      console.log(chalk.cyan('\n🌐 Your Public Address:'));
      console.log(chalk.white.bold(`   ${tunnelUrl}`));
      console.log(chalk.yellow('\n⚠️  Note: Cloudflare provides HTTPS URL'));
      console.log(chalk.white(`   Minecraft may connect via hostname: ${tunnelUrl.replace('https://', '')}`));
      console.log(chalk.yellow('\n⚠️  Press Ctrl+C to stop'));
    }
  });
  
  cfProcess.on('error', (error) => {
    clearTimeout(timeout);
    console.log(chalk.red(`\n❌ Failed: ${error.message}`));
    process.exit(1);
  });
  
  cfProcess.on('exit', (code) => {
    if (code !== 0 && !tunnelUrl) {
      clearTimeout(timeout);
      console.log(chalk.red(`\n❌ Process exited with code ${code}`));
      process.exit(1);
    }
  });
}

testCloudflared().catch(console.error);
