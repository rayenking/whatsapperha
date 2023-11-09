import axios from 'axios';
import fs from 'fs';
import path from 'path';
import tar from 'tar';

async function ensureDirExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function renameFolder(oldPath: string, newPath: string): Promise<void> {
    fs.renameSync(oldPath, newPath);
  }

async function getLatestReleaseAsset(owner: string, repo: string): Promise<void> {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    const latestRelease = response.data;
    console.log('Latest Release:', latestRelease.name);

    const asset = latestRelease.assets[0];
    console.log('Asset Name:', asset.name);
    console.log('Asset Download URL:', asset.browser_download_url);

    const tempFileDir = path.join(__dirname, 'temp');
    const tempFilePath = path.join(__dirname, 'temp', asset.name);
    const destinationFilePath = path.join(__dirname, asset.name);

    await ensureDirExists(tempFileDir);

    await downloadFile(asset.browser_download_url, tempFilePath);
    console.log(`File downloaded to ${tempFilePath}`);

    await extractFile(tempFilePath, destinationFilePath);
    console.log(`File extracted to ${destinationFilePath}`);

    if (fs.existsSync(path.join(__dirname, 'baileys'))){
        await deleteFolderRecursive(path.join(__dirname, 'baileys'));
        console.log('Deleting baileys folder for update');
    }

    await renameFolder(path.join(__dirname, 'package'), path.join(__dirname, 'baileys'))
    console.log(`Folder renamed to baileys`)

    await deleteFolderRecursive(path.join(__dirname, 'temp'));
    console.log('Temporary files deleted.');
  } catch (error: any) {
    console.error('Error retrieving latest release asset:', error.message);
  }
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function extractFile(sourcePath: string, destinationPath: string): Promise<void> {
  await tar.x({
    file: sourcePath,
    cwd: path.dirname(destinationPath),
  });
}

async function deleteFolderRecursive(folderPath: string): Promise<void> {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);

      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(folderPath);
  }
}

getLatestReleaseAsset('WhiskeySockets', 'Baileys');
