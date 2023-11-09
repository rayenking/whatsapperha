// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------

import { WASocket } from "./baileys/lib";
import { ParseMessage } from "./message";

type MatchTypes = { [key: string]: boolean}
type ChatTypes = { [key: string]: boolean}

export type EventListener = {
    command: string;
    type: string;
    case_sensitive: boolean;
    chat_type: string;
    ignoreSelf: boolean;
    waitId: string;
    fname: string;
    callback: Function;
    hook: { [key: string]: boolean };
}

export const eventListener: EventListener[] = [];

export const commands = (command: string, type: string = 'startswith') => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].command = command
            eventListener[indexEvent].type = type
        } else {
            let event: EventListener = {
                command,
                type,
                case_sensitive: false,
                chat_type: 'all',
                ignoreSelf: true,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: {}
            }
            eventListener.push(event)
        }
    }
}

export const entity = ({case_sensitive = false, chat_type = 'all', ignoreSelf = true}) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].case_sensitive = case_sensitive
            eventListener[indexEvent].chat_type = chat_type
            eventListener[indexEvent].ignoreSelf = ignoreSelf
        } else {
            let event: EventListener = {
                command: '',
                type: 'startswith',
                case_sensitive: case_sensitive,
                chat_type: chat_type,
                ignoreSelf: ignoreSelf,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: {}
            }
            eventListener.push(event)
        }
    }
}

export const hook = (type: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].hook[type] = true
        } else {
            let event: EventListener = {
                command: '',
                type: 'startswith',
                case_sensitive: false,
                chat_type: 'all',
                ignoreSelf: true,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: { [type]: true}
            }
            eventListener.push(event)
        }
    }
}

export const waitSince = (type: string, id: string, msg: ParseMessage, timeout: number): Promise<ParseMessage> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const waitIndex = eventListener.findIndex(obj => obj.waitId === id)
            if (waitIndex !== -1){
                eventListener.splice(waitIndex, 1)
                const timeoutMsg: ParseMessage = msg
                timeoutMsg.isWaitTimeout = true
                resolve(timeoutMsg)
            }
        }, timeout)

        let event: EventListener = {
            command: '',
            type: 'startswith',
            case_sensitive: false,
            chat_type: 'all',
            ignoreSelf: true,
            waitId: id,
            fname: '',
            callback: async (client: WASocket, message: ParseMessage) => {
                if (msg.parse.sender === message.parse.sender){
                    const waitIndex = eventListener.findIndex(obj => obj.waitId === id)
                    if (waitIndex !== -1){
                        eventListener.splice(waitIndex, 1)
                        clearTimeout(timeoutId)
                        resolve(message)
                    }
                }
            },
            hook: { [type]: true}
        }
        eventListener.push(event)
    });
}

export const call = (client: WASocket, message: ParseMessage) => {
    const { type, isMention, mentionedJid } = message.parse;
  
    eventListener.forEach((event) => {
      if (event.ignoreSelf && message.parse.sender === message.parse.self.id) {
        return;
      }
  
      if (event.hook?.text && (type === 'conversation' || type === 'extendedTextMessage')) {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.mention && isMention) {
        const userid = message.parse.self.id;
        const number = userid.split(':')[0] || userid.split('@')[0];
  
        for (const mentioned of mentionedJid) {
          if (mentioned.replace('@s.whatsapp.net', '').includes(number)) {
            message.parse.text = message.parse.text.replace(/@\S+/g, '').trim();
            if (condition(message.parse, event)) {
              event.callback(client, message);
            }
          }
        }
      } else if (event.hook?.image && type === 'imageMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.video && type === 'videoMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.audio && type === 'audioMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.location && type === 'locationMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.sticker && type === 'stickerMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.caption && (type === 'imageMessage' || type === 'videoMessage')) {
        const isCaption = (message.message as any)[type]?.caption;
        if (isCaption) {
          message.parse.text = isCaption;
          if (condition(message.parse, event)) {
            event.callback(client, message);
          }
        }
      } else if (event.hook?.listResponse && type === 'listResponseMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.buttonResponse && type === 'buttonsResponseMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.join && type === 27) {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.leave && type === 28) {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      }
    });
  };
  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
const condition = (message: any, event: EventListener): boolean => {
    const { type, case_sensitive, chat_type } = event;
    const messageText = case_sensitive ? message.text : message.text.toLowerCase();
    const commands = event.command.split(',').map(cmd => case_sensitive ? cmd.trim() : cmd.trim().toLowerCase());

    const matchTypes: MatchTypes = {
        'startswith': commands.some(command => messageText.startsWith(command)),
        'contains': commands.some(command => messageText.includes(command)),
        'exact': commands.some(command => messageText === command),
        'endswith': commands.some(command => messageText.endsWith(command)),
        'regex': commands.some(command => messageText.match(command))
    }

    const isMatch: boolean = matchTypes[type];
    const isGroup: boolean = message.isGroup;
    const isPrivate: boolean = !isGroup;

    const chatTypes: ChatTypes = {
        'all': true,
        'group': isGroup,
        'private': isPrivate
    };

    const isChatTypeMatch: boolean = chatTypes[chat_type];

    return isMatch && isChatTypeMatch;
}
