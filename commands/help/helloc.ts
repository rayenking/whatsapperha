import { RhClient, setDefaultPrefix } from "@rhook/rh";
import { commands, entity, hook } from "@rhook/hook";
import { ParseMessage } from "@rhook/types";

class HelloCommand {

    @commands('ping')
    @entity({ignoreSelf: false})
    @hook('text')
    async hello(client: RhClient, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.parse.to, `PONG! ${message.pushName}`);
    }

    @commands('boot')
    @entity({ignorePublic: true, ignoreSelf: false})
    @hook('text')
    async rhboot(client: RhClient, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.to, `Restarting...`);
        await client.restart(message.to)
    }

    @commands('exec')
    @entity({ignoreSelf: false, isAdmin: true})
    @hook('text')
    async exec(client: RhClient, message: ParseMessage): Promise<void> {
        let sep = message.parse.text.split('\n');
        let text = message.parse.text.replace(sep[0] + '\n', '');

        const codeFormat = (text: string) => "```\n" + text + "\n```";

        await client.sendMessage(message.parse.to, `Trying to Execute\n${codeFormat(text)}`);
    
        const print = async function(text: string){
            await client.sendMessage(message.parse.to, text);
        }
    
        try {
            var f = `(async () => {
                try {
                    ${text}
                } catch (e){
                    client.sendMessage(message.parse.to, codeFormat(String(e.stack)))
                }
            })()`
            eval(f)
        } catch (e: any) {
            print(e.stack);
        }
    }

    @commands('me', 'exact')
    @entity({ignoreSelf: false})
    @hook('text')
    async me(client: RhClient, message: ParseMessage): Promise<void> {
        await message.reply(`You are ${message.pushName}`);
        await client.sendContact(message.parse.to, message.parse.number, message.pushName || 'Unknown Name')    
    }

    @commands('debug', 'exact')
    @entity({ignoreSelf: false, ignorePublic: true})
    @hook('text')
    async debug(client: RhClient, message: ParseMessage): Promise<void> {
        client.options.debug = !client.options.debug
        await client.sendMessage(message.parse.to, `Debug: ${client.options.debug}`);
    }

    @commands('tag', 'exact')
    @entity({ignoreSelf: false})
    @hook('text')
    async tag(client: RhClient, message: ParseMessage): Promise<void> {
        if (message.sender === message.self?.id && !message.parse.isGroup) {
            await message.editWithMentions(`@${message.to.replace('@s.whatsapp.net', '')}`, [message.to])
        }
    }

    @commands('{tag}', 'contains')
    @entity({ignoreSelf: false})
    @hook('text')
    async contains(client: RhClient, message: ParseMessage): Promise<void> {
        if (message.sender === message.self?.id && !message.parse.isGroup) {
            var text = message.parse.text.replace('{tag}', `@${message.to.replace('@s.whatsapp.net', '')}`)
            await message.editWithMentions(text, [message.to])
        }
    }

    @commands('setprefix', 'startswith', '')
    @entity({ignoreSelf: false, isAdmin: true})
    @hook('text')
    async setprefix(client: RhClient, message: ParseMessage): Promise<void> {
        let sep = message.parse.text.split(' ');
        let text = message.parse.text.replace(sep[0] + ' ', '');
        setDefaultPrefix(text)
        client.updatePrefix(text, 'setprefix')
        await message.reply(`Prefix has been changed to ${text}`)
    }
}
