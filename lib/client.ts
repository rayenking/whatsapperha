// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------

import makeWASocket, { DisconnectReason, useMultiFileAuthState, makeInMemoryStore, WASocket } from './baileys/lib';
import { message_parse } from './message';
import { connectToMongoDB } from './mongodb';
import UtilsRH from './util';

import P from 'pino';
import fs from 'fs';
import { Boom } from '@hapi/boom'
import { call } from './hook';

export type RhOptions = {
    qrTerminal: boolean;
    statePath: string;
    storePath: string;
}

class WhatsappRH {

    options: RhOptions;
    store: any;
    user: any;
    utils: UtilsRH;
    socket!: WASocket;

    constructor (options: RhOptions) {
        this.options = options;
        this.options.qrTerminal = options.qrTerminal || false;
        this.options.statePath = options.statePath || './data/auth/state.json';
        this.options.storePath = options.storePath || './data/store/store.json';

        if (!fs.existsSync('./data/auth')) {
            fs.mkdirSync('./data/auth', { recursive: true });
        }

        if (!fs.existsSync('./data/store')) {
            fs.mkdirSync('./data/store', { recursive: true });
        }

        this.store = makeInMemoryStore({ });
        this.set_store();

        this.user = null;

        this.utils = new UtilsRH(this.socket);

        connectToMongoDB()

    }

    async connect () {
        const { state, saveCreds } = await useMultiFileAuthState(this.options.statePath);
        this.socket = makeWASocket({
            logger: P({ level: 'silent'}),
            printQRInTerminal: this.options.qrTerminal,
            auth: state,
            version: [2,2323,4]
        })
        this.store?.bind(this.socket.ev);

        this.socket.ev.process(
            async (events: { [x: string]: any; }) => {
                if (events['connection.update']){
                    const update = events['connection.update'];
                    const { connection, lastDisconnect} = update;
                    if (connection === 'close') {
                        if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut){
                            this.connect()
                        }
                    } else if (connection === 'open') {
                        this.user = this.socket.user;
                        this.utils = new UtilsRH(this.socket)
                        console.log(`WhatsappRH (RynsHook): Login successful. Welcome ${this.socket.user?.name}!`);
                    }
                }

                if (events['creds.update']){
                    await saveCreds()
                }

                if (events['messaging-history.set']) {
                    const { chats, contacts, messages, isLatest } = events['messaging-history.set']
                    console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`)
                }

                if (events['messages.upsert']){
                    const upsert = events['messages.upsert'];
                    if (upsert.messages === undefined) return;

                    for (const msg of upsert.messages) {
                        msg.self = this.socket.user
                        try {
                            call(this.socket, message_parse(msg))
                        } catch (error) {
                            this.socket.sendMessage(process.env.DEBUG_NUMBER || '', {text: `Error: ${error}`})
                        }
                    }
                }
            }
        )
        return this
    }

    set_store () {
        this.store.readFromFile(this.options.storePath);
        setInterval(() => {
            this.store.writeToFile(this.options.storePath);
        }, 10_000);
    }
}

export default WhatsappRH;