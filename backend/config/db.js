import mongoose from "mongoose";

export async function connectDB() {
    const uri = process.env.MONGO_URI;
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        if (!uri) console.error("MONGO_URI environment variable is not set.");
        throw error;
    }
}