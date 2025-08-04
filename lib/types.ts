import { Contact, WAMessage, WAProto } from "@rhook/baileys";
import { proto } from "@rhook/baileys";
import { HookTypes } from "./hook";

export type WhatsappClientOptions = {
    pairingCode: boolean;
    defaultQueryTimeoutMs?: number;
    debug?: boolean;
}

export type InteractiveMessage = {
    initialText: string;
    footerText?: string;
    header?: proto.Message.InteractiveMessage.Header;
    nativeFlowMessage?: proto.Message.InteractiveMessage.NativeFlowMessage;
}

export type CarouselMessage = {
    cards: proto.Message.InteractiveMessage.ICarouselMessage;
}

//------------------------------------------------------------------------------
// Types for better type safety and clarity
// Messages types
//------------------------------------------------------------------------------
export type ListResponse = {
    selectedText?: string | null;
    selectedRowId?: string | null;
    listType?: proto.Message.ListResponseMessage.ListType | null;
    title?: string | null;
    description?: string | null;
    buttonText?: string | null;
    footerText?: string | null;
    sections?: proto.Message.ListMessage.ISection[] | null;
};

export type ButtonResponse = {
    selectedButtonId?: string | null;
    selectedDisplayText?: string | null;
};

export type Parse = {
    sender: string;
    to: string;
    text: string;
    mentionedJid: string[];
    isGroup: boolean;
    isMention: boolean;
    isReply: boolean;
    type: string;
    self: Contact | null;
    number: string;
    list?: ListResponse | null;
    button?: ButtonResponse | null;
};

type MessageFunctions = {
    edit: (text: string) => Promise<WAProto.WebMessageInfo | undefined>;
    editWithMentions: (text: string, mentionedJid: string[]) => Promise<WAProto.WebMessageInfo | undefined>;
    send: (text: string) => Promise<WAProto.WebMessageInfo | undefined>;
    sendMention: (text: string, mentionedJid: string[]) => Promise<WAProto.WebMessageInfo | undefined>;
    reply: (text: string) => Promise<WAProto.WebMessageInfo | undefined>;
    delete: () => Promise<WAProto.WebMessageInfo | undefined>;
    deleteMe: () => Promise<void>;
    download: () => Promise<string>;
    forward: (to: string, force: boolean) => Promise<WAProto.WebMessageInfo | undefined>;
};

export type HookParameter = {
    types: HookTypes[] | HookTypes;
    timeout?: number;
    timeoutCallback?: () => void;
    cancelText?: string;
    ignoreSelf?: boolean;
    ignoreId?: string;
}

export type ParseMessage = WAMessage & {
    parse: Parse;
    self: Contact | null;
    isWaitTimeout: boolean;
    to: string;
    sender: string;
    messageId: string;
    fromMe: boolean;
    messageTimestamp: number;
    waitSince: (params: HookParameter) => Promise<ParseMessage>;
} & MessageFunctions;