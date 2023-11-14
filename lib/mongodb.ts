import mongoose from 'mongoose';

export const connectToMongoDB = () => {
    mongoose.connect(process.env.MONGODB_URL || '')
        .then(() => console.log(`Connected to ${process.env.MONGODB_URL}`))
        .catch((error) => console.error(`Error connecting ${process.env.MONGODB_URL} to MongoDB:`, error));
}