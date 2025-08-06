// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).

import { downloadMediaMessage } from "@rhook/baileys";
import { writeFile } from 'fs/promises'
import { RhClient } from "@rhook/rh";
import { ParseMessage } from "@rhook/types";
import { HookParameter } from "./types";
import { waitSince } from "./hook";

// Utility function to handle list and button messages
const handleButtonAndListResponse = (msg: ParseMessage): void => {
    const { parse, message } = msg;

    if (parse.type === 'listResponseMessage') {
        const listResponse = message?.listResponseMessage;
        const listQuotedResponse = listResponse?.contextInfo?.quotedMessage?.listMessage;

        parse.list = {
            selectedText: listResponse?.title || null,
            selectedRowId: listResponse?.singleSelectReply?.selectedRowId || null,
            listType: listResponse?.listType || null,
            title: listQuotedResponse?.title || null,
            description: listQuotedResponse?.description || null,
            buttonText: listQuotedResponse?.buttonText || null,
            footerText: listQuotedResponse?.footerText || null,
            sections: listQuotedResponse?.sections || null,
        };
    } else if (parse.type === 'buttonsResponseMessage') {
        const buttonsResponse = message?.buttonsResponseMessage;

        parse.button = {
            selectedButtonId: buttonsResponse?.selectedButtonId || null,
            selectedDisplayText: buttonsResponse?.selectedDisplayText || null,
        };
    }
};

const handleFunctions = (msg: ParseMessage, client: RhClient): void => {
    msg.edit = (text: string) => {
        return client.whatsapp.sendMessage(msg.to, { text, edit: msg.key });
    };

    msg.editWithMentions = (text: string, mentionedJid: string[]) => {
        return client.whatsapp.sendMessage(msg.to, { text, edit: msg.key, mentions: mentionedJid });
    };

    msg.send = (text: string) => {
        return client.whatsapp.sendMessage(msg.to, { text });
    };

    msg.sendMention = (text: string, mentionedJid: string[]) => {
        return client.sendMentions(msg.to, text, mentionedJid);
    };

    msg.reply = (text: string) => {
        return client.whatsapp.sendMessage(msg.to, { text }, { quoted: msg });
    };

    msg.delete = () => {
        return client.deleteMessage(msg.to, msg.key)
    }

    // msg.deleteMe = () => {
    //     return client.deleteMessageMe(msg.to, msg.messageId, msg.fromMe, msg.messageTimestamp)
    // }

    msg.forward = (to: string, force: boolean = false) => {
        return client.forwardMessage(to, msg, force)
    }

    msg.download = async () => {
        let path: string = '';
        switch (msg.parse.type) {
            case 'imageMessage':
                var buffer = await downloadMediaMessage(msg, 'buffer', {})
                await writeFile(`./downloads/${msg.key.id}.jpg`, buffer)
                path = `./downloads/${msg.key.id}.jpg`
                break;
            case 'documentMessage':
                var buffer = await downloadMediaMessage(msg, 'buffer', {})
                await writeFile(`./downloads/${msg.key.id}.jpg`, buffer)
                path = `./downloads/${msg.key.id}.jpg`
                break;
            case 'audioMessage':
                var buffer = await downloadMediaMessage(msg, 'buffer', {})
                await writeFile(`./downloads/${msg.key.id}.jpg`, buffer)
                path = `./downloads/${msg.key.id}.jpg`
                break;
            case 'videoMessage':
                var buffer = await downloadMediaMessage(msg, 'buffer', {})
                await writeFile(`./downloads/${msg.key.id}.jpg`, buffer)
                path = `./downloads/${msg.key.id}.jpg`
                break;
        }
        return path;
    }
}

// Main parsing function
export const MessageParse = (msg: ParseMessage, client: RhClient): ParseMessage => {
    const isGroup = msg.key.remoteJid?.includes('@g.us') || false;
    const extendedText = msg.message?.extendedTextMessage;
    const contextInfo = extendedText?.contextInfo;

    const isMention = Boolean(contextInfo?.mentionedJid?.length);
    const isReply = Boolean(contextInfo?.quotedMessage);
    const mentionedJid = contextInfo?.mentionedJid || [];

    let sender = isGroup ? msg.key.participant || '' : msg.key.remoteJid || '';
    let to = msg.key.remoteJid || '';
    let text = msg.message?.conversation || extendedText?.text || '';
    let type = msg.message ? Object.keys(msg.message)[0] : msg.messageStubType?.toString() || '';

    if (msg.key.fromMe) {
        sender = msg.self?.id || '';
        to = msg.key.remoteJid || '';
    }

    if (type === 'senderKeyDistributionMessage') {
        const senderKeyTypes = Object.keys(msg.message?.senderKeyDistributionMessage || {});
        type = senderKeyTypes[senderKeyTypes.length - 1] || '';
    }

    if (type === 'messageContextInfo') {
        const typeMessages = Object.keys(msg.message || {});
        type = typeMessages[typeMessages.length - 1] || '';
    }

    msg.to = to;
    msg.sender = sender;
    msg.messageId = msg.key.id || '';
    msg.fromMe = msg.key.fromMe || false;
    msg.parse = {
        sender: sender,
        to,
        text,
        mentionedJid,
        isGroup,
        isMention,
        isReply,
        type,
        self: msg.self,
        number: sender.replace('@s.whatsapp.net', '') || '',
        list: null,
        button: null,
    };
    msg.waitSince = (params: HookParameter) => waitSince({
        types: params.types,
        waitMsg: msg,
        timeout: params.timeout || 10000,
        timeoutCallback: params.timeoutCallback,
        cancelText: params.cancelText || 'Cancelled.',
        ignoreSelf: params.ignoreSelf || true,
        ignoreId: params.ignoreId || '',
    })

    handleButtonAndListResponse(msg);
    handleFunctions(msg, client);

    return msg;
};
