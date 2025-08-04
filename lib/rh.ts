import { generateWAMessageFromContent, MiscMessageGenerationOptions, proto, WAMediaUpload, WAProto, WASocket } from "@rhook/baileys";
import { CarouselMessage, InteractiveMessage, ParseMessage, WhatsappClientOptions } from "@rhook/types";
import { exec } from 'child_process';
import { updatePrefix } from "@rhook/hook";
import fs from 'fs';

export let DEFAULT_PREFIX = ''

class MessageFormater {

    public static codeFormat(text: string): string {
        return "```\n" + text + "\n```";
    }

    public static bold(text: string): string {
        return "*" + text + "*";
    }

    public static italic(text: string): string {
        return "_" + text + "_";
    }
}

export const setDefaultPrefix = (prefix: string) => {
    DEFAULT_PREFIX = prefix
}

export class RhClient extends MessageFormater {

    public whatsapp: WASocket
    public options: WhatsappClientOptions
    public fromSystem: { [key: string]: boolean } = {}

    constructor(whatsapp: WASocket, options: WhatsappClientOptions) {

        super()
        this.whatsapp = whatsapp
        this.options = options
    }

    public getPrefix(): string {
        return DEFAULT_PREFIX
    }

    public updatePrefix(prefix: string, ignoreCommand: string) {
        updatePrefix(prefix, ignoreCommand)
    }

    public async restart(to: string) {

        exec('pm2 restart ryns', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error restarting with pm2: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`pm2 stderr: ${stderr}`);
                return;
            }

            console.log(`pm2 stdout: ${stdout}`);
        });

        const restartPointPath = 'data/restartpoint.txt';

        fs.writeFile(restartPointPath, to, (err: NodeJS.ErrnoException | null) => {
            if (err) {
                console.error(`Error writing to ${restartPointPath}: ${err.message}`);
            } else {
                console.log(`Restart point written to ${restartPointPath}`);
            }
        });
    }

    public async sendMessage(to: string, message: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { text: message }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendImage(to: string, image: WAMediaUpload, caption?: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { image, caption }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendVideo(to: string, video: WAMediaUpload, caption?: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { video, caption }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendAudio(to: string, audio: WAMediaUpload, caption?: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { audio, caption }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendDocument(to: string, document: WAMediaUpload, mimetype: string, caption?: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { document, caption, mimetype }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendLocation(to: string, latitude: number, longitude: number, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { location: { degreesLatitude: latitude, degreesLongitude: longitude } }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendContact(to: string, number: string, name: string, options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + `FN:${name}\n` // full name
            + 'ORG:;\n' // the organization of the contact
            + `TEL;type=CELL;type=VOICE;waid=${number}:${number}\n` // WhatsApp ID + phone number
            + 'END:VCARD';
        const result = await this.whatsapp.sendMessage(
            to,
            { 
                contacts: { 
                    displayName: name, 
                    contacts: [{ vcard }] 
                }
            },
            options
        )
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendReaction(to: string, key: proto.IMessageKey, reaction: string): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { react: { key, text: reaction } })
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendMentions(to: string, text: string, mentions: string[], options?: MiscMessageGenerationOptions): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { text, mentions }, options)
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async deleteMessage(to: string, key: proto.IMessageKey): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { delete: key })
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    // public async deleteMessageMe(to: string, message_id: string, fromMe: boolean, timestamp: number) {
    //     await this.whatsapp.chatModify({
    //         clear: {
    //             messages: [
    //                 {
    //                     id: message_id,
    //                     fromMe,
    //                     timestamp,
    //                 }
    //             ]
    //         }
    //     }, to)
    // }

    public async forwardMessage(to: string, message: ParseMessage, force: boolean = false): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { forward: message, force })
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async editMessage(to: string, key: proto.IMessageKey, message: string): Promise<WAProto.WebMessageInfo | undefined> {
        const result = await this.whatsapp.sendMessage(to, { edit: key, text: message })
        this.fromSystem[result?.key.id ?? ''] = true
        return result
    }

    public async sendInteractiveMessage(to: string, interactiveMessage: InteractiveMessage, carouselMessage?: CarouselMessage) {
        const msg = generateWAMessageFromContent(
            to, {
                interactiveMessage: {
                    body: {
                        text: interactiveMessage.initialText
                    },
                    footer: {
                        text: interactiveMessage.footerText || ''
                    },
                    header: interactiveMessage?.header,
                    nativeFlowMessage: interactiveMessage?.nativeFlowMessage,
                    carouselMessage: carouselMessage?.cards
            }
        }, {
            userJid: to,
        })
        await this.whatsapp.relayMessage(to, msg.message!, {
            messageId: msg.key?.id ?? '',
        })
        this.fromSystem[msg.key?.id ?? ''] = true
        return msg
    }
}