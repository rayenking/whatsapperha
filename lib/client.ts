// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------

import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, ConnectionState, WAMessage, MessageUpsertType, Browsers } from '@rhook/baileys';
import { WhatsappClientOptions } from '@rhook/types';

import { Boom } from '@hapi/boom';
import { call } from '@rhook/hook';
import { RhClient } from '@rhook/rh';

import Pino, { Logger } from 'pino';
import fs from 'fs'
import readline from 'readline'
import mongoose from 'mongoose';
import { MessageParse } from '@rhook/message';
import { ParseMessage } from '@rhook/types';
import QRCode from 'qrcode';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

export class WhatsappClient {
    private whatsapp!: WASocket;
    private logger: Logger;
    // private store: ReturnType<typeof makeInMemoryStore>;
    private authPath: string;
    private options: WhatsappClientOptions;
    private rh: RhClient;

    public rlog: Logger;
    
    constructor(options: WhatsappClientOptions) {
        const dataDir = process.env.DATA_DIR || './data/baileys'
        const storePath = process.env.STORE_PATH || dataDir + '/store.json'

        this.authPath = process.env.AUTH_PATH || dataDir + '/auth'

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.logger = Pino({
            level: process.env.LOG_LEVEL || 'silent',
            name: 'whatsapp-baileys',
        })
        this.rlog = Pino({
            level: process.env.LOG_LEVEL || 'info',
            name: 'whatsapp-rhook',
            transport: {
                target: 'pino-pretty',
            }
        })


        // this.store = makeInMemoryStore({ logger: this.logger })
        // setInterval(() => {
        //     this.store?.writeToFile(storePath)
        // }, 10_000)

        this.options = options
        this.rh = new RhClient(this.whatsapp, this.options);

        mongoose.connect(process.env.MONGODB_URL || '')
            .then(() => this.rlog.info(`mongodb connected to ${process.env.MONGODB_URL}`))
            .catch((error) => this.rlog.error(`Error connecting ${process.env.MONGODB_URL} to MongoDB:`, error));
    }

    async initialize() {
        const { state, saveCreds } = await useMultiFileAuthState(this.authPath)
        const { version, isLatest } = await fetchLatestBaileysVersion();

        this.rlog.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

        this.whatsapp = makeWASocket({
            logger: this.logger,
            // printQRInTerminal: !this.options.pairingCode,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger),
            },
            version: version,
            generateHighQualityLinkPreview: true,
            // browser: Browsers.macOS('Desktop'),
            markOnlineOnConnect: false,
        })
        // this.store?.bind(this.whatsapp.ev)

        if (this.options.pairingCode && !this.whatsapp.authState.creds.registered) {
            const phoneNumber = await question('Enter your phone number: ')
            const code = await this.whatsapp.requestPairingCode(phoneNumber)
            console.log(`Pairing code: ${code}`)
        }

        this.whatsapp.ev.process(
            async (events) => {
                if (events['connection.update']) {
                    this.connectionUpdateHandler(events['connection.update'])
                }
                if (events['creds.update']) {
                    await saveCreds();
                }
                if (events['messages.upsert']) {
                    this.messageHandler(events['messages.upsert'])
                }
            }
        )
    }

    private connectionUpdateHandler(event: Partial<ConnectionState>) {
		const { connection, lastDisconnect, qr } = event

        if (qr && !this.options.pairingCode) {
            QRCode.toString(qr, {type: 'terminal', small: true}).then((qrCode) => {
                this.rlog.info(`WhatsappRH (RynsHook): Scan the QR code above to login.`)
                console.log(qrCode)
            })
        }

        if (connection === 'open') {
            this.rh = new RhClient(this.whatsapp, this.options)
            if (!fs.existsSync('data/restartpoint.txt')) {
                fs.writeFileSync('data/restartpoint.txt', '')
            }
            let restartPoint = fs.readFileSync('data/restartpoint.txt', 'utf8');
            let DEBUG_NUMBER = restartPoint ? restartPoint : (process.env.DEBUG_NUMBER || this.whatsapp.user?.id)
            if (DEBUG_NUMBER) {
                this.whatsapp.sendMessage(DEBUG_NUMBER, {text: `WhatsappRH (RynsHook): Login successful. Welcome ${this.whatsapp.user?.name}!`})
            }
            fs.writeFileSync('data/restartpoint.txt', '')
            this.rlog.info(`WhatsappRH (RynsHook): Login successful. Welcome ${this.whatsapp.user?.name}!`)
        } else if (connection === 'close') {
            if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut){
                console.log('Connection closed!')
                this.initialize()
            }
        }
    }

    private messageHandler(events: {
        messages: WAMessage[];
        type: MessageUpsertType;
        requestId?: string;
    }) {
        if (events.messages === undefined) return;
        for (const message of events.messages) {
            var msg = message as ParseMessage
            try {
                msg.self = this.whatsapp.user ?? null
                // if (msg.self?.id?.includes(':')) {
                //     msg.self.id = msg.self.id.split(':')[0] + '@s.whatsapp.net'
                // }
                call(this.rh, MessageParse(msg, this.rh))
            } catch (error) {
                if (process.env.DEBUG_NUMBER) {
                    this.whatsapp.sendMessage(process.env.DEBUG_NUMBER, {text: `WhatsappRH (RynsHook): Error calling hook: ${error}`})
                }
                this.rlog.error(error)
                }
            }
        }
    
}