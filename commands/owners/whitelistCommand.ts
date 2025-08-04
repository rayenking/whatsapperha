import { commands, entity, hook, waitSince } from "@rhook/hook";
import { RhClient } from "@rhook/rh";
import { ParseMessage } from "@rhook/types";
import WhitelistHelper from "../../helpers/WhitelistHelper";
import { Whitelist } from "../../models/whitelist";

const replaceAll = (str: String, find: RegExp, replace: any) => {
    return str.replace(new RegExp(find, 'g'), replace)
}

const parseNumber = (number: string) => {
    if (number.startsWith('0')){
        number = '62' + number.slice(1)
    }
    number = replaceAll(number, /\ /gi, "")
    number = replaceAll(number, /\+/gi, "")
    number = replaceAll(number, /\(/gi, "")
    number = replaceAll(number, /\)/gi, "")
    number = replaceAll(number, /\-/gi, "")
    return number.trim()
}

class WhitelistCommand {

    @commands('whitelist, wl')
    @entity({ignoreSelf: true})
    @hook('text')
    async whitelist(client: RhClient, message: ParseMessage) {
        let args = message.parse.text.split(' ').slice(1)
        if (args.length === 0) return client.sendMessage(message.parse.to, 'Usage: whitelist <add|remove> <phoneNumber>')
        const whitelistHelper = new WhitelistHelper();
        const cmd = args[0]
        switch(cmd){
        case 'add':
            var number = parseNumber(args[1])
            var isWhitelist = await whitelistHelper.isWhitelist(number)
            if (isWhitelist) return client.sendMessage(message.parse.to, `${number} is already in whitelist`)
            const add = await whitelistHelper.addWhitelist({Number: number} as Whitelist)
            if (add){
                await client.sendMessage(message.parse.to, `${number} added to whitelist.`)
            } else {
                await client.sendMessage(message.parse.to, `${number} failed to add.`)
            }
            break
        case 'remove':
            var number = parseNumber(args[1])
            var isWhitelist = await whitelistHelper.isWhitelist(number)
            if (!isWhitelist) return client.sendMessage(message.parse.to, `${number} not in whitelist`)
            const del = await whitelistHelper.delWhitelist(number)
            if (del){
                await client.sendMessage(message.parse.to, `${number} deleted in whitelist.`)
            } else {
                await client.sendMessage(message.parse.to, `${number} failed to delete.`)
            }
            break
        case 'list':
            const list = await whitelistHelper.getAllWhitelist()
            if (list.length === 0) return
            const listText = list.map(item => item.Number).join(', ')
            await client.sendMessage(message.parse.to, listText)
            break
        }
    }
}