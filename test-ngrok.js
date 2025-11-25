// Quick test script to verify ngrok is working
const ngrok = require('ngrok');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

async function testNgrok() {
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.cyan('NGROK TUNNEL TEST'));
  console.log(chalk.cyan('='.repeat(60)));
  
  // Check for saved auth token
  const configDir = path.join(process.env.APPDATA || process.env.HOME, '.redstone');
  const ngrokConfigFile = path.join(configDir, 'ngrok-config.json');
  
  let authToken = null;
  if (await fs.pathExists(ngrokConfigFile)) {
    const config = await fs.readJson(ngrokConfigFile);
    authToken = config.authToken;
    console.log(chalk.green('✅ Auth token found in config'));
    console.log(chalk.gray(`   Token: ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 5)}`));
  } else {
    console.log(chalk.red('❌ No auth token found'));
    console.log(chalk.yellow('   Run the server start to configure ngrok'));
    process.exit(1);
  }
  
  console.log(chalk.cyan('\n🔧 Test Parameters:'));
  console.log(chalk.white(`   Port: 25565`));
  console.log(chalk.white(`   Protocol: tcp`));
  
  console.log(chalk.cyan('\n🚀 Connecting to ngrok (will auto-start agent)...'));
  
  try {
    const url = await ngrok.connect({
      addr: 25565,
      authtoken: authToken,
      proto: 'tcp'
    });
    
    console.log(chalk.green('\n✅ SUCCESS!'));
    console.log(chalk.cyan('\n📊 Connection Details:'));
    console.log(chalk.white(`   Raw URL: ${url}`));
    console.log(chalk.white(`   Type: ${typeof url}`));
    
    const tunnelAddress = url.replace('tcp://', '');
    console.log(chalk.white(`   Processed: ${tunnelAddress}`));
    
    console.log(chalk.green('\n🌐 Your Public Address:'));
    console.log(chalk.white.bold(`   ${tunnelAddress}`));
    
    console.log(chalk.cyan('\n🔍 Verifying URL format:'));
    const urlPattern = /^[0-9]+\.tcp\.[a-z0-9-]+\.ngrok\.io:[0-9]+$/i;
    if (urlPattern.test(tunnelAddress)) {
      console.log(chalk.green('   ✅ URL format is valid'));
    } else {
      console.log(chalk.yellow('   ⚠️  URL format is unusual'));
    }
    
    console.log(chalk.cyan('\n📋 Return Value Test:'));
    const returnedValue = tunnelAddress;
    console.log(chalk.white(`   Value: ${returnedValue}`));
    console.log(chalk.white(`   Type: ${typeof returnedValue}`));
    console.log(chalk.white(`   Length: ${returnedValue.length}`));
    console.log(chalk.white(`   Truthy: ${!!returnedValue}`));
    
    console.log(chalk.cyan('\n🔌 Disconnecting...'));
    await ngrok.disconnect();
    await ngrok.kill();
    
    console.log(chalk.green('✅ Test completed successfully!\n'));
    
  } catch (error) {
    console.log(chalk.red('\n❌ FAILED!'));
    console.log(chalk.red(`   Error: ${error.message}`));
    console.log(chalk.yellow('\n📋 Error Details:'));
    console.log(error);
    process.exit(1);
  }
}

testNgrok().catch(console.error);
