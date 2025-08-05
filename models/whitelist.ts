import mongoose, { Document, Schema } from 'mongoose';

export interface Whitelist extends Document {
    number: string;
}

const WhitelistSchema: Schema = new Schema({
    number: {type: String, required: true}
})

export const WhitelistModel = mongoose.model<Whitelist>('Whitelist', WhitelistSchema)