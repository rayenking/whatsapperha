import { WASocket } from "@adiwajshing/baileys";
import { commands, entity, hook, waitSince } from "../../lib/hook";
import { ParseMessage } from "../../lib/message";

class HelloCommand {

    @commands('ping')
    @entity({ignoreSelf: false})
    @hook('text')
    async hello(client: WASocket, message: ParseMessage): Promise<void> {
        await client.sendMessage(message.parse.to, {text: `PONG! ${message.pushName}`});
    }

    @commands('exec')
    @entity({ignoreSelf: false})
    @hook('text')
    async exec(client: WASocket, message: ParseMessage): Promise<void> {
        let sep = message.parse.text.split('\n');
        let text = message.parse.text.replace(sep[0] + '\n', '');

        const codeFormat = (text: string) => "```\n" + text + "\n```";

        await client.sendMessage(message.parse.to, {text: `Trying to Execute\n${codeFormat(text)}`});
    
        const print = async function(text: string){
            await client.sendMessage(message.parse.to, {text: text});
        }
    
        try {
            var f = `(async () => {
                try {
                    ${text}
                } catch (e){
                    client.sendMessage(message.parse.to, {text: codeFormat(String(e.stack))})
                }
            })()`
            eval(f)
        } catch (e: any) {
            print(e.stack);
        }
    }
}
