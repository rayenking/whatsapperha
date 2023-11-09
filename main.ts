// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------
// RH (Ryns Hook) is a simple wrapper for the Whatsapp Web API.
// It is a Node.js module that allows you to easily create a bot that can
// interact with the Whatsapp Web API.
//------------------------------------------------------------------------------

import WhatsappRH, { RhOptions } from './lib/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const commandPath = './commands';
const commandDirectories = fs.readdirSync(commandPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const options: RhOptions = {
  qrTerminal: true,
  statePath: '',
  storePath: ''
};

const rynshook = new WhatsappRH(options);

export const rh = rynshook;

for (const directory of commandDirectories) {
  const directoryPath = path.join(commandPath, directory);
  const commandFiles = fs.readdirSync(directoryPath);

  for (const file of commandFiles) {
    if (!file.endsWith('.ts')) {
      continue;
    }

    try {
      const filePath = path.join(directoryPath, file);
    //   const fileContents = fs.readFileSync(filePath, 'utf-8');
      // You can execute the file using eval() function like this:
    //   eval(fileContents);
      // Or, you can use import() statement like this:
      import(`./${filePath}`);
      console.log(`Import Success : ${filePath}`);
    } catch (error) {
      console.log(`Import Error : ${directoryPath}/${file}`);
    }
  }
}

async function main() {
  await rynshook.connect();
}

main();
