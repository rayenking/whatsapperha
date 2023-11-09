// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).

import { WAMessage, proto } from "./baileys/lib";

//------------------------------------------------------------------------------
type ListResponse = {
    selectedText: string | undefined | null;
    selectedRowId: string | undefined | null;
    listType: proto.Message.ListResponseMessage.ListType | null | undefined;
    title: string | null| undefined;
    description: string | null | undefined;
    buttonText: string | null | undefined;
    footerText: string | null | undefined;
    sections: proto.Message.ListMessage.ISection[] | null | undefined;

}

type ButtonResponse = {
    selectedButtonId: string | null | undefined;
    selectedDisplayText: string | null | undefined;
}

export type Parse = {
    sender: string;
    to: string;
    text: string;
    mentionedJid: string[];
    isGroup: boolean;
    isMention: boolean;
    isReply: boolean;
    type: string | number;
    self: {[key: string]: string};
    number: string;
    list: ListResponse | null | undefined;
    button: ButtonResponse | null | undefined;
}
export type ParseMessage = WAMessage & {
    parse: Parse
    self: {[key: string]: string}
}

const message_buttonlist = (msg: ParseMessage): ParseMessage => {
    if (msg.parse.type === 'listResponseMessage'){
        const listResponse = msg.message?.listResponseMessage;
        const listQuotedResponse = listResponse?.contextInfo?.quotedMessage?.listMessage;
        msg.parse.list = {
            selectedText: listResponse?.title,
            selectedRowId: listResponse?.singleSelectReply?.selectedRowId,
            listType: listResponse?.listType,
            title: listQuotedResponse?.title,
            description: listQuotedResponse?.description,
            buttonText: listQuotedResponse?.buttonText,
            footerText: listQuotedResponse?.footerText,
            sections: listQuotedResponse?.sections,
        };
    } else if (msg.parse.type === 'buttonsResponseMessage'){
        const buttonsResponse = msg.message?.buttonsResponseMessage;
        msg.parse.button = {
            selectedButtonId: buttonsResponse?.selectedButtonId,
            selectedDisplayText: buttonsResponse?.selectedDisplayText
        }
    }
    return msg;
}

export const message_parse = (msg: ParseMessage): ParseMessage => {
    let isGroup = msg.key.remoteJid?.includes('@g.us') || false;
    let isMention = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length || 0) > 0 || false;
    let isReply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage !== undefined || false;
    let mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let sender = isGroup ? msg.key.participant : msg.key.remoteJid;
    let to = msg.key.remoteJid || '';
    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    let type = msg.message ? Object.keys(msg.message)[0] : (msg.messageStubType || '').toString();
    let self = msg.self || {};
    if (msg.key.fromMe){
        sender = self.id || '';
        to = msg.key.remoteJid || '';
    }

    if (type === 'senderKeyDistributionMessage'){
        let senderKeyDistributionMessage = msg.message ? Object.keys(msg.message.senderKeyDistributionMessage || {}) : [];
        type = senderKeyDistributionMessage[senderKeyDistributionMessage.length - 1] || '';
    }

    if (type === 'messageContextInfo'){
        let typeMessages = Object.keys(msg.message || {})
        type = typeMessages[typeMessages.length - 1] || ''
    }

    msg.parse = {
        sender: sender || '',
        to: to || '',
        text: text || '',
        mentionedJid: mentionedJid || [],
        isGroup: isGroup || false,
        isMention: isMention || false,
        isReply: isReply || false,
        type: type || '',
        self: self || {},
        number: sender?.replace('@s.whatsapp.net', '') || '',
        list: null,
        button: null
    }
    msg = message_buttonlist(msg);
    return msg;
}
