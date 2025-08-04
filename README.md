# WhatsApp Erha (Ryns Hook)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16.14.2-green.svg)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-Latest-orange.svg)](https://github.com/whiskeysockets/baileys)

## ⚠️ Important Note from Baileys

[Baileys](https://github.com/whiskeysockets/baileys) library was originally a project for CS-2362 at Ashoka University and is in no way affiliated with or endorsed by WhatsApp. Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

## 📖 Description

WhatsApp Erha is a WhatsApp bot framework built with TypeScript using the [Baileys](https://github.com/whiskeysockets/baileys) library. This framework provides an easy-to-use command system with decorator pattern, supports various message types, and includes admin management features.

### ✨ Key Features

- 🔧 **Decorator-based Command System** - Easy command creation with decorators
- 📱 **Multi-message Support** - Supports text, image, video, audio, sticker, location, etc.
- 👥 **Admin System** - Admin system with permission management
- 🗄️ **MongoDB Integration** - Database support for data storage
- 🔐 **QR Code Authentication** - Login using QR code
- ⚡ **PM2 Process Management** - Production-ready with PM2
- 🎯 **TypeScript Support** - Full TypeScript support with type safety

## 🚀 Installation

### Prerequisites

- Node.js v16.14.2 or higher
- Yarn package manager
- MongoDB (optional, for database features)

### Setup

1. **Install Yarn** (if not already installed):
```bash
npm install -g yarn
```

2. **Clone repository**:
```bash
git clone https://github.com/rayenking/whatsapperha.git
cd whatsapperha
```

3. **Install dependencies**:
```bash
yarn install
```

4. **Install Baileys library**:
```bash
yarn install-baileys
```

5. **Setup environment variables**:
```bash
cp .env.example .env
```

Edit the `.env` file with appropriate configurations:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/whatsapperha

# Logging
LOG_LEVEL=info

# Data paths
DATA_DIR=./data/baileys
STORE_PATH=./data/baileys/store.json
AUTH_PATH=./data/baileys/auth

# Admin numbers (comma separated)
ADMINS=6281234567890,6289876543210
```

## 🏃‍♂️ How to Run

### Development Mode
```bash
yarn dev
```

### Production Mode
```bash
# Build project
yarn build

# Start with Node.js
yarn start

# Start with PM2 (recommended for production)
yarn start:erha
```

### PM2 Commands
```bash
# Restart application
yarn restart

# Stop application
yarn stop
```

## 📁 Project Structure

```
whatsapperha/
├── commands/           # Command modules
│   ├── auto/          # Auto-response commands
│   ├── dialog/        # Dialog/interactive commands
│   ├── help/          # Help and utility commands
│   └── owners/        # Owner/admin commands
├── lib/               # Core library files
│   ├── client.ts      # WhatsApp client implementation
│   ├── hook.ts        # Decorator system
│   ├── message.ts     # Message parsing
│   └── types.ts       # TypeScript type definitions
├── models/            # Database models
├── helpers/           # Helper utilities
└── main.ts           # Application entry point
```

## 🛠️ Creating Commands

### Basic Command Structure

Create a new folder inside `commands/` and create a `.ts` file for your command:

```typescript
import { RhClient } from "@rhook/rh";
import { commands, entity, hook } from "@rhook/hook";
import { ParseMessage } from "@rhook/types";

class MyCommand {
    @commands('hello')
    @entity({ignoreSelf: false})
    @hook('text')
    async hello(client: RhClient, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.parse.to, `Hello ${message.pushName}!`);
    }
}
```

### Decorator Options

#### @commands(command, type, prefix)
- **command**: String command or array of commands
- **type**: `'startswith'` | `'contains'` | `'exact'` | `'endswith'` | `'regex'` (default: `'startswith'`)
- **prefix**: Custom prefix (default: `'!'`)

#### @entity(options)
```typescript
@entity({
    case_sensitive: false,    // Case sensitive matching
    chat_type: 'all',        // 'all' | 'group' | 'private'
    ignoreSelf: true,        // Ignore own messages
    ignorePublic: false,     // Only respond to self messages
    isAdmin: false          // Admin only command
})
```

#### @hook(type)
Available types:
- `'text'` - Text messages
- `'image'` - Image messages
- `'video'` - Video messages
- `'audio'` - Audio messages
- `'location'` - Location messages
- `'sticker'` - Sticker messages
- `'caption'` - Image/video captions
- `'listResponse'` - List response messages
- `'buttonResponse'` - Button response messages
- `'join'` - Group join events
- `'leave'` - Group leave events
- `'contact'` - Contact messages

### Example Commands

#### Simple Ping Command
```typescript
@commands('ping')
@entity({ignoreSelf: false})
@hook('text')
async ping(client: RhClient, message: ParseMessage): Promise<void> {
    await client.sendMessage(message.parse.to, `PONG! ${message.pushName}`);
}
```

#### Admin Only Command
```typescript
@commands('restart')
@entity({isAdmin: true})
@hook('text')
async restart(client: RhClient, message: ParseMessage): Promise<void> {
    await client.sendMessage(message.parse.to, `Restarting...`);
    await client.restart(message.parse.to);
}
```

#### Image Handler
```typescript
@commands('caption')
@entity({ignoreSelf: false})
@hook('caption')
async handleCaption(client: RhClient, message: ParseMessage): Promise<void> {
    await client.sendMessage(message.parse.to, `Caption: ${message.parse.text}`);
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | - |
| `LOG_LEVEL` | Logging level | `info` |
| `DATA_DIR` | Data directory path | `./data/baileys` |
| `STORE_PATH` | Store file path | `./data/baileys/store.json` |
| `AUTH_PATH` | Auth directory path | `./data/baileys/auth` |
| `ADMINS` | Admin phone numbers (comma separated) | - |

### Default Prefix
The default prefix is `!`. To change the prefix globally:

```typescript
import { setDefaultPrefix } from "@rhook/rh";

setDefaultPrefix('.'); // Change prefix to '.'
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Run in development mode with hot reload |
| `yarn build` | Build TypeScript to JavaScript |
| `yarn start` | Start compiled application |
| `yarn start:erha` | Start with PM2 process manager |
| `yarn restart` | Restart PM2 process |
| `yarn stop` | Stop PM2 process |
| `yarn install-baileys` | Install latest Baileys library |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

- **Ryns** - [GitHub](https://github.com/rayenking)

## 🙏 Special Thanks

- [Whiskeysockets](https://github.com/Whiskeysockets) - Baileys library
- [Baileys Community](https://github.com/whiskeysockets/baileys) - For the amazing WhatsApp library

## ⚠️ Disclaimer

This project is for educational purposes only. Please use responsibly and in accordance with WhatsApp's Terms of Service. The authors are not responsible for any misuse of this software.
