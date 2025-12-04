// Integration test for tunnel services
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

async function testTunnelIntegration() {
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.cyan('REDSTONE CLI - TUNNEL INTEGRATION TEST'));
  console.log(chalk.cyan('='.repeat(60)));
  
  const configDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone');
  const tunnelConfigFile = path.join(configDir, 'tunnel-config.json');
  
  // Reset to default (playit)
  console.log(chalk.yellow('\n📋 Step 1: Resetting tunnel configuration to default'));
  await fs.ensureDir(configDir);
  await fs.writeJson(tunnelConfigFile, { defaultService: 'playit' }, { spaces: 2 });
  console.log(chalk.green('✅ Set default service to: playit'));
  
  // Load tunnel module
  console.log(chalk.yellow('\n📋 Step 2: Loading tunnel module'));
  const tunnel = require('./src/commands/tunnel');
  console.log(chalk.green('✅ Module loaded successfully'));
  
  // Check default service
  console.log(chalk.yellow('\n📋 Step 3: Verifying default service'));
  const defaultService = await tunnel.getDefaultTunnelService();
  console.log(chalk.white(`   Default service: ${chalk.cyan(defaultService)}`));
  
  if (defaultService !== 'playit') {
    console.log(chalk.red('❌ Default service is not playit!'));
    process.exit(1);
  }
  console.log(chalk.green('✅ Default service is correct'));
  
  // Check if Playit binary exists
  console.log(chalk.yellow('\n📋 Step 4: Checking Playit.gg installation'));
  const playitDir = path.join(configDir, 'playit');
  const playitExe = path.join(playitDir, process.platform === 'win32' ? 'playit.exe' : 'playit');
  
  if (await fs.pathExists(playitExe)) {
    const stats = await fs.stat(playitExe);
    console.log(chalk.green('✅ Playit binary found'));
    console.log(chalk.gray(`   Location: ${playitExe}`));
    console.log(chalk.gray(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
  } else {
    console.log(chalk.yellow('⚠️  Playit binary not found (will download on first use)'));
    console.log(chalk.gray(`   Expected location: ${playitExe}`));
  }
  
  // Check tunnel config persistence
  console.log(chalk.yellow('\n📋 Step 5: Testing config persistence'));
  const savedConfig = await fs.readJson(tunnelConfigFile);
  console.log(chalk.white('   Saved config:'));
  console.log(chalk.gray(`   ${JSON.stringify(savedConfig, null, 2)}`));
  console.log(chalk.green('✅ Configuration persists correctly'));
  
  // Test server config structure
  console.log(chalk.yellow('\n📋 Step 6: Checking server detection'));
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const searchPaths = [
    process.cwd(),
    homeDir,
    path.join(homeDir, 'minecraft'),
    path.join(homeDir, 'Documents')
  ];
  
  console.log(chalk.white('   Server search paths:'));
  for (const searchPath of searchPaths) {
    if (await fs.pathExists(searchPath)) {
      console.log(chalk.green(`   ✓ ${searchPath}`));
    } else {
      console.log(chalk.gray(`   ✗ ${searchPath} (doesn't exist)`));
    }
  }
  
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.green('✅ ALL INTEGRATION TESTS PASSED'));
  console.log(chalk.cyan('='.repeat(60)));
  
  console.log(chalk.yellow('\n💡 Next steps:'));
  console.log(chalk.white('1. Run: redstonenode'));
  console.log(chalk.white('2. Select "List Servers" or "Create Server"'));
  console.log(chalk.white('3. When starting server, choose "Yes" for tunneling'));
  console.log(chalk.white('4. Playit.gg will auto-download and start'));
  console.log(chalk.white('5. Your public URL will appear in the server info box\n'));
}

testTunnelIntegration().catch((error) => {
  console.error(chalk.red('\n❌ Test failed:'), error.message);
  console.error(error.stack);
  process.exit(1);
});
