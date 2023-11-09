import { WASocket } from "../../lib/baileys/lib";
import { commands, entity, hook, waitSince } from "../../lib/hook";
import { ParseMessage } from "../../lib/message";

class DialogCommand {

    @commands('register')
    @entity({ignoreSelf: false})
    @hook('text')
    async dialog(client: WASocket, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.parse.to, {text: 'What\'s your name?'})
        let name = await waitSince('text', 'justarandomid', message, 10000)
        if (name.isWaitTimeout){
            await client.sendMessage(message.parse.to, {text: 'Timeout! Repeat the command if you want to register.'})
            return
        }
        await client.sendMessage(message.parse.to, {text: `Register success\nName: ${name.parse.text}`})
    }
}