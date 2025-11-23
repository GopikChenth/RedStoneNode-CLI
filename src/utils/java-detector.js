const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function detect() {
  const platform = getPlatform();
  
  try {
    let javaPath = 'java';
    let version = null;

    // Try to find Java
    if (platform === 'windows') {
      // Check JAVA_HOME first
      if (process.env.JAVA_HOME) {
        javaPath = `"${process.env.JAVA_HOME}\\bin\\java.exe"`;
      }
    } else if (platform === 'termux') {
      // Termux uses pkg
      javaPath = 'java';
    } else {
      // Linux
      if (process.env.JAVA_HOME) {
        javaPath = `${process.env.JAVA_HOME}/bin/java`;
      }
    }

    // Test Java and get version
    try {
      const { stdout } = await execAsync(`${javaPath} -version 2>&1`);
      const versionMatch = stdout.match(/version "(.+?)"/);
      
      if (versionMatch) {
        version = versionMatch[1];
        
        return {
          found: true,
          path: javaPath.replace(/"/g, ''),
          version: version,
          platform: platform
        };
      }
    } catch (error) {
      // Java not found
      return {
        found: false,
        platform: platform
      };
    }

  } catch (error) {
    return {
      found: false,
      platform: platform,
      error: error.message
    };
  }
}

function getPlatform() {
  if (process.platform === 'win32') {
    return 'windows';
  } else if (process.platform === 'android' || process.env.PREFIX?.includes('com.termux')) {
    return 'termux';
  } else {
    return 'linux';
  }
}

module.exports = { detect, getPlatform };
