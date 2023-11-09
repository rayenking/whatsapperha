import { commands, entity, hook, waitSince } from "../../lib/hook";
import { WASocket } from "../../lib/baileys/lib";
import { ParseMessage } from "../../lib/message";
import { rh } from "../../main";

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

class Whitelist {

    @commands('whitelist, wl')
    @entity({ignoreSelf: true})
    @hook('text')
    async whitelist(client: WASocket, message: ParseMessage) {
        let args = message.parse.text.split(' ').slice(1)
        if (args.length === 0) return client.sendMessage(message.parse.to, {text: 'Usage: whitelist <add|remove> <phoneNumber>'})
        const cmd = args[0]
        switch(cmd){
        case 'add':
            var number = parseNumber(args[1])
            var isWhitelist = await rh.utils.isWhitelist(number)
            if (isWhitelist) return client.sendMessage(message.parse.to, {text: `${number} is already in whitelist`})
            const add = await rh.utils.addWhitelist(message, number)
            if (add){
                await client.sendMessage(message.parse.to, {text: `${number} added to whitelist.`})
            } else {
                await client.sendMessage(message.parse.to, {text: `${number} failed to add.`})
            }
            break
        case 'remove':
            var number = parseNumber(args[1])
            var isWhitelist = await rh.utils.isWhitelist(number)
            if (!isWhitelist) return client.sendMessage(message.parse.to, {text: `${number} not in whitelist`})
            const del = await rh.utils.delWhitelist(message, number)
            if (del){
                await client.sendMessage(message.parse.to, {text: `${number} deleted in whitelist.`})
            } else {
                await client.sendMessage(message.parse.to, {text: `${number} failed to delete.`})
            }
            break
        case 'list':
            const list = await rh.utils.listWhitelist(message)
            if (list == '') return
            await client.sendMessage(message.parse.to, {text: list})
            break
        }
    }
}