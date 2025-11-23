const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const SERVER_APIS = {
  vanilla: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  papermc: 'https://api.papermc.io/v2/projects/paper',
  spigot: null, // Requires BuildTools
  fabric: 'https://meta.fabricmc.net/v2/versions',
  forge: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
};

async function download(serverType, minecraftVersion, targetDir) {
  switch (serverType) {
    case 'vanilla':
      return await downloadVanilla(minecraftVersion, targetDir);
    case 'papermc':
      return await downloadPaperMC(minecraftVersion, targetDir);
    case 'spigot':
      throw new Error('Spigot requires BuildTools. Please download manually from https://www.spigotmc.org/');
    case 'fabric':
      return await downloadFabric(minecraftVersion, targetDir);
    case 'forge':
      throw new Error('Forge requires manual installation. Download from https://files.minecraftforge.net/');
    default:
      throw new Error(`Unknown server type: ${serverType}`);
  }
}

async function downloadVanilla(version, targetDir) {
  try {
    // Get version manifest
    const manifestResponse = await axios.get(SERVER_APIS.vanilla);
    const versionData = manifestResponse.data.versions.find(v => v.id === version);

    if (!versionData) {
      throw new Error(`Minecraft version ${version} not found`);
    }

    // Get version details
    const versionResponse = await axios.get(versionData.url);
    const serverUrl = versionResponse.data.downloads?.server?.url;

    if (!serverUrl) {
      throw new Error(`Server JAR not available for version ${version}`);
    }

    // Download server JAR
    const jarPath = path.join(targetDir, 'server.jar');
    const response = await axios({
      method: 'get',
      url: serverUrl,
      responseType: 'stream'
    });

    await streamPipeline(response.data, fs.createWriteStream(jarPath));
    return jarPath;

  } catch (error) {
    throw new Error(`Failed to download Vanilla server: ${error.message}`);
  }
}

async function downloadPaperMC(version, targetDir) {
  try {
    // Get available versions
    const versionsResponse = await axios.get(SERVER_APIS.papermc);
    const versions = versionsResponse.data.versions;

    if (!versions.includes(version)) {
      throw new Error(`PaperMC version ${version} not found. Available: ${versions.slice(-5).join(', ')}`);
    }

    // Get builds for version
    const buildsResponse = await axios.get(`${SERVER_APIS.papermc}/versions/${version}`);
    const latestBuild = buildsResponse.data.builds[buildsResponse.data.builds.length - 1];

    // Get download info
    const buildResponse = await axios.get(`${SERVER_APIS.papermc}/versions/${version}/builds/${latestBuild}`);
    const downloadName = buildResponse.data.downloads.application.name;

    // Download server JAR
    const downloadUrl = `${SERVER_APIS.papermc}/versions/${version}/builds/${latestBuild}/downloads/${downloadName}`;
    const jarPath = path.join(targetDir, 'server.jar');

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    await streamPipeline(response.data, fs.createWriteStream(jarPath));
    return jarPath;

  } catch (error) {
    throw new Error(`Failed to download PaperMC server: ${error.message}`);
  }
}

async function downloadFabric(version, targetDir) {
  try {
    // Get Fabric installer
    const versionsResponse = await axios.get('https://meta.fabricmc.net/v2/versions/loader');
    const loaderVersion = versionsResponse.data[0].version;

    // Download Fabric server launcher
    const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVersion}/0.11.2/server/jar`;
    const jarPath = path.join(targetDir, 'server.jar');

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream'
    });

    await streamPipeline(response.data, fs.createWriteStream(jarPath));
    return jarPath;

  } catch (error) {
    throw new Error(`Failed to download Fabric server: ${error.message}`);
  }
}

async function getAvailableVersions(serverType) {
  try {
    switch (serverType) {
      case 'vanilla': {
        const response = await axios.get(SERVER_APIS.vanilla);
        return response.data.versions
          .filter(v => v.type === 'release')
          .map(v => v.id)
          .slice(0, 20);
      }
      case 'papermc': {
        const response = await axios.get(SERVER_APIS.papermc);
        return response.data.versions.slice(-20);
      }
      default:
        return [];
    }
  } catch (error) {
    return [];
  }
}

module.exports = { download, getAvailableVersions };
