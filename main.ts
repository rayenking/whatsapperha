// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------
// RH (Ryns Hook) is a simple wrapper for the Whatsapp Web API.
// It is a Node.js module that allows you to easily create a bot that can
// interact with the Whatsapp Web API.
//------------------------------------------------------------------------------

import { WhatsappClient } from '@rhook/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { WhatsappClientOptions } from '@rhook/types';
import { setDefaultPrefix } from '@rhook/rh';

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const hasPairingCodeFlag = args.includes('--pairing-code');

const isCompiled = __filename.endsWith('.js');
const baseDir = isCompiled ? './dist' : '.';
const commandPath = path.join(baseDir, 'commands');
const commandDirectories = fs.readdirSync(commandPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const options: WhatsappClientOptions = {
  pairingCode: hasPairingCodeFlag
};

const rynshook = new WhatsappClient(options);

rynshook.rlog.info(isCompiled ? 'Running in compiled mode' : 'Running in development mode');
rynshook.rlog.info(`Base Directory: ${baseDir}`);
if (hasPairingCodeFlag) {
  rynshook.rlog.info('Pairing code mode enabled');
}

setDefaultPrefix('!')

for (const directory of commandDirectories) {
  const directoryPath = path.join(commandPath, directory);
  const commandFiles = fs.readdirSync(directoryPath);

  for (const file of commandFiles) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) {
      continue;
    }

    try {
      const filePath = path.join(directoryPath, file);
    //   const fileContents = fs.readFileSync(filePath, 'utf-8');
      // You can execute the file using eval() function like this:
    //   eval(fileContents);
      // Or, you can use import() statement like this:
      // const modulePath = filePath.replace(/\.(ts|js)$/, '');
      // import(`./${filePath}`);
      const importPath = isCompiled 
        ? filePath.replace('./dist/', './')
        : filePath;
        
      import(importPath);
      rynshook.rlog.info(`Import Success : ${filePath}`);
    } catch (error) {
      rynshook.rlog.error(`Import Error : ${directoryPath}/${file}`);
    }
  }
}

rynshook.initialize()
