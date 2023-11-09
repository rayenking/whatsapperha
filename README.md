# Whatsapp Erha (Ryns Hook)

## Important Note from Baileys

[Baileys](https://github.com/whiskeysockets/baileys) library was originally a project for CS-2362 at Ashoka University and is in no way affiliated with or endorsed by WhatsApp. Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

## Description

This is a Typescript project that uses the [Baileys](https://github.com/whiskeysockets/baileys) library for WhatsApp Bot Connection. It includes various scripts for testing, starting the application, and installing dependencies. 

## Installation

Before starting the installation, make sure you have yarn installed. If not, you can install it by running the following command:

```bash
npm install -g yarn
```


1. Clone the repository
2. Run `yarn`
3. Run `yarn install-baileys`: Installs the latest Baileys library
3. Start the application with `yarn start`

## How to run

Before running the application, make sure to copy the `.env.example` file and rename it to `.env`. Update the `.env` file with your own configurations. Here is an example of how to do this:

```bash
cp .env.example .env
```

After setting up the `.env` file, you can run the following commands to start the application:


- `yarn start`: Starts the application
- `yarn start:erha`: Starts the application with PM2

## Example Command

Create new file in commands folder and create the sub folder

```
commands
  - folderName
    - helloc.ts
    - greeting.ts
```

```ts
import { WASocket } from "../../lib/baileys/lib"
import { commands, entity, hook, waitSince } from "../../lib/hook";
import { ParseMessage } from "../../lib/message";

class HelloCommand {

    @commands('ping')
    @entity({ignoreSelf: false})
    @hook('text')
    async hello(client: WASocket, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.parse.to, {text: `PONG! ${message.pushName}`});
    }
}
```

```ts
@hook(type: string)
// type
//   - text
//   - mention
//   - image
//   - video
//   - audio
//   - location
//   - sticker
//   - caption
//   - listResponse
//   - buttonResponse
//   - join
//   - leave
@entity({case_sensitive = false, chat_type = 'all', ignoreSelf = true})
// chat_type (all, group, private) default to 'all'
@commands(command: string, type: string = 'startswith')
// type (default to 'startswith')
//   - starswith
//   - contains
//   - exact
//   - endswith
//   - regex
```

## Author

- [Ryns](https://github.com/rayenking)

## Special Thanks To
- [Whiskeysockets](https://github.com/Whiskeysockets)