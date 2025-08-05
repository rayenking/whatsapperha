import { Whitelist, WhitelistModel } from "../models/whitelist";

class WhitelistHelper {

    async getAllWhitelist(): Promise<Whitelist[]> {
        const whitelists = await WhitelistModel.find().exec();
        return whitelists;
    }

    async getWhitelistByNumber(number: string): Promise<Whitelist | null> {
        const whitelist = await WhitelistModel.findOne({ number: number }).exec()
        return whitelist;
    }

    async isWhitelist(number: string): Promise<boolean> {
        const whitelist = await WhitelistModel.findOne({ number: number }).exec()
        return whitelist ? true : false;
    }

    async addWhitelist(whitelistData: Whitelist): Promise<boolean> {
        try {
            const newWhitelist = new WhitelistModel(whitelistData)
            await newWhitelist.save()
            return true
        } catch (e) {
            return false
        }
    }

    async delWhitelist(number: string): Promise<boolean> {
        try {
            await WhitelistModel.deleteOne({ number: number })
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default WhitelistHelper;