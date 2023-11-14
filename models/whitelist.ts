import mongoose, { Document, Schema } from 'mongoose';

export interface Whitelist extends Document {
    Number: string;
}

const WhitelistSchema: Schema = new Schema({
    Number: {type: String, required: true}
})

export const WhitelistModel = mongoose.model<Whitelist>('Whitelist', WhitelistSchema)