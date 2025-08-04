// nodejs version: v16.14.2
//------------------------------------------------------------------------------
// Copyright (c) 2022, Ryns (https://github.com/rynkings).
//------------------------------------------------------------------------------

import { ParseMessage } from "@rhook/types";
import { RhClient, DEFAULT_PREFIX } from "@rhook/rh";
import Pino from 'pino'
import fs from 'fs';

type MatchTypes = { [key: string]: boolean}
type ChatTypes = { [key: string]: boolean}

const rlog = Pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'whatsapp-rhook',
  transport: {
      target: 'pino-pretty',
  }
})

export type EventListener = {
    command: string;
    prefix: string;
    type: string;
    case_sensitive: boolean;
    chat_type: string;
    ignoreSelf: boolean;
    ignorePublic: boolean;
    isAdmin: boolean;
    waitId: string;
    fname: string;
    callback: Function;
    hook: { [key: string]: boolean };
}

export const eventListener: EventListener[] = [];
export const admins: string[] = process.env.ADMINS?.split(',') || [];

export const updateEnvAdmins = (admins: string[]) => {
  const envFilePath = '.env';
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const updatedEnvContent = envContent.replace(/ADMINS=.*/, `ADMINS=${admins.join(',')}`);
  fs.writeFileSync(envFilePath, updatedEnvContent, 'utf8');
};

export const updatePrefix = (prefix: string, ignoreCommand: string) => {
    eventListener.forEach(event => {
        if (event.command !== ignoreCommand){
            event.prefix = prefix
        }
    })
}

export const commands = (command: string, type: 'startswith' | 'contains' | 'exact' | 'endswith' | 'regex' = 'startswith', prefix: string = DEFAULT_PREFIX) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].command = command
            eventListener[indexEvent].type = type
            eventListener[indexEvent].prefix = prefix
        } else {
            let event: EventListener = {
                command,
                prefix: prefix,
                type,
                case_sensitive: false,
                chat_type: 'all',
                ignoreSelf: true,
                ignorePublic: false,
                isAdmin: false,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: {}
            }
            eventListener.push(event)
        }
    }
}

type ChatTypeOptions = 'all' | 'group' | 'private';

export const entity = ({case_sensitive = false, chat_type = 'all' as ChatTypeOptions, ignoreSelf = true, ignorePublic = false, isAdmin = false}) => {
    if (!['all', 'group', 'private'].includes(chat_type)) {
        throw new Error(`Invalid chat_type: ${chat_type}. Allowed values are 'all', 'group', 'private'.`);
    }

    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].case_sensitive = case_sensitive
            eventListener[indexEvent].chat_type = chat_type
            eventListener[indexEvent].ignoreSelf = ignoreSelf
            eventListener[indexEvent].ignorePublic = ignorePublic
            eventListener[indexEvent].isAdmin = isAdmin
        } else {
            let event: EventListener = {
                command: '',
                type: 'startswith',
                prefix: '',
                case_sensitive: case_sensitive,
                chat_type: chat_type,
                ignoreSelf: ignoreSelf,
                ignorePublic: ignorePublic,
                isAdmin: isAdmin,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: {}
            }
            eventListener.push(event)
        }
    }
}

export type HookTypes = 'text' | 'image' | 'video' | 'audio' | 'location' | 'sticker' | 'caption' | 'listResponse' | 'buttonResponse' | 'join' | 'leave' | 'contact';

export const hook = (type: HookTypes) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const indexEvent = eventListener.findIndex(obj => obj.fname === propertyKey)
        if (indexEvent !== -1){
            eventListener[indexEvent].hook[type] = true
        } else {
            let event: EventListener = {
                command: '',
                prefix: '',
                type: 'startswith',
                case_sensitive: false,
                chat_type: 'all',
                ignoreSelf: true,
                ignorePublic: false,
                isAdmin: false,
                waitId: '',
                fname: propertyKey,
                callback: descriptor.value,
                hook: { [type]: true}
            }
            eventListener.push(event)
        }
    }
}

export type HookParameterType = {
    types: HookTypes[] | HookTypes;
    waitMsg: ParseMessage;
    timeout: number;
    timeoutCallback?: () => void;
    cancelText: string;
    ignoreSelf: boolean;
    ignoreId: string;
}
export const waitSince = ({types, waitMsg, timeoutCallback, timeout = 10000, cancelText = 'Cancelled.', ignoreSelf = true, ignoreId = ''}: HookParameterType): Promise<ParseMessage> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timeoutId = setTimeout(() => {
          const waitIndexes = eventListener.reduce((indexes, obj, index) => {
              if (obj.waitId === id) indexes.push(index);
              return indexes;
          }, [] as number[]);

          if (waitIndexes.length > 0) {
              for (let i = waitIndexes.length - 1; i >= 0; i--) {
                  eventListener.splice(waitIndexes[i], 1);
              }
              const timeoutMsg: ParseMessage = waitMsg;
              timeoutMsg.isWaitTimeout = true;
              if (timeoutCallback) {
                  timeoutCallback();
              } else {
                  waitMsg.send('Timeout!');
              }
              resolve(timeoutMsg);
          }
      }, timeout)

      if (!Array.isArray(types)) {
        types = [types]
      }
      let event: EventListener = {
        command: '',
        prefix: '',
        type: 'startswith',
        case_sensitive: false,
        chat_type: 'all',
        ignoreSelf: ignoreSelf === true,
        ignorePublic: false,
        isAdmin: false,
        waitId: id,
        fname: '',
        callback: async (client: RhClient, message: ParseMessage) => {
            if (waitMsg.parse.sender === message.parse.sender && message.messageId !== ignoreId) {
                const waitIndexes = eventListener.reduce((indexes, obj, index) => {
                    if (obj.waitId === id) indexes.push(index);
                    return indexes;
                }, [] as number[]);
                if (waitIndexes.length > 0) {
                    for (let i = waitIndexes.length - 1; i >= 0; i--) {
                        eventListener.splice(waitIndexes[i], 1);
                    }
                    clearTimeout(timeoutId)
                    if (message.parse.text.toLocaleLowerCase() === 'cancel') {
                        message.isWaitTimeout = true;
                        message.send(cancelText || 'Cancelled.');
                        resolve(message);
                    } else {
                        resolve(message);
                    }
                }
            }
        },
        hook: types.reduce((acc, type) => {
          acc[type] = true;
          return acc;
        }, {} as { [key: string]: boolean }),
      }
      eventListener.push(event)
    })
}

export const call = (client: RhClient, message: ParseMessage) => {
    if (message.parse.text) {
        rlog.info(`${message.to} - ${message.parse.text.slice(0, 100)}`)
    }
    if (client.options.debug) {
        console.log(JSON.stringify(message, null, 2))
    }
    const { type, isMention, mentionedJid } = message.parse;

    if (message.parse.self){
      if (!admins.includes(message.parse.self.id)){
        admins.push(message.parse.self.id);

        updateEnvAdmins(admins);
      }
    }

    eventListener.forEach((event) => {
      if (event.ignoreSelf && message.parse.sender === message.parse.self?.id) {
        return;
      }

      if (event.ignorePublic && message.sender !== message.parse.self?.id) {
        return;
      }

      if (event.isAdmin && !admins.includes(message.sender)) {
        return;
      }
  
      if (event.hook?.text && (type === 'conversation' || type === 'extendedTextMessage')) {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.mention && isMention) {
        const userid = message.parse.self?.id;
        const number = userid?.split(':')[0] || userid?.split('@')[0];
        if (number) {
          for (const mentioned of mentionedJid) {
            if (mentioned.replace('@s.whatsapp.net', '').includes(number)) {
              message.parse.text = message.parse.text.replace(/@\S+/g, '').trim();
              if (condition(message.parse, event)) {
                event.callback(client, message);
              }
            }
          }
        }
      } else if (event.hook?.contact && type === 'contactMessage') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
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
      } else if (event.hook?.join && type === '27') {
        if (condition(message.parse, event)) {
          event.callback(client, message);
        }
      } else if (event.hook?.leave && type === '28') {
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
        'startswith': commands.some(command => messageText.startsWith(event.prefix + command)),
        'contains': commands.some(command => messageText.includes(event.prefix + command)),
        'exact': commands.some(command => messageText === event.prefix + command),
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
