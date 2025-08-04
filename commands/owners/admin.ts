import { RhClient, setDefaultPrefix } from "@rhook/rh";
import { commands, entity, hook, HookParameterType, waitSince } from "@rhook/hook";
import { ParseMessage } from "@rhook/types";
import { updateEnvAdmins, admins } from "@rhook/hook";

class Admin {

    @commands('add admin')
    @entity({ignoreSelf: false, isAdmin: true})
    @hook('text')
    async addAdmin(client: RhClient, message: ParseMessage): Promise<void> {

        let result = await message.send('Please send the number or contact to add admin');
        let numberMsg = await waitSince({types: ['text', 'contact'], waitMsg: message, ignoreId: result?.key.id ?? ''} as HookParameterType);

        console.log(numberMsg)
        // let jid = number.parse.text.trim();
        // admins.push(jid);
        // updateEnvAdmins(admins);
        // await client.sendMessage(message.parse.to, `Added ${jid} to admins`);
    }
}