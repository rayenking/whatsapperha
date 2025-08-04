import { RhClient } from "@rhook/rh";
import { commands, entity, hook, HookParameterType, waitSince } from "@rhook/hook";
import { ParseMessage } from "@rhook/types";

class DialogCommand {

    @commands('register')
    @entity({ignoreSelf: false})
    @hook('text')
    async dialog(client: RhClient, message: ParseMessage): Promise<void> {
        await message.reply('What\'s your name?')
        const nameMessage = await message.waitSince({
            types: 'text',
            timeout: 10000,
            cancelText: 'Timeout! Repeat the command if you want to register.',
        })
        if (nameMessage.isWaitTimeout){
            await client.sendMessage(message.parse.to, 'Timeout! Repeat the command if you want to register.')
            return
        }
        await message.reply(`Register success\nName: ${nameMessage.parse.text}`)
    }
}