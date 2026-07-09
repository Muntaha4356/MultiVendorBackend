import mongoose from "mongoose";

const connectDb = async () => {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
    const dbName = process.env.MONGODB_DB || "e-shop";

    try {
        // Register listeners before establishing the connection
        mongoose.connection.on("connected", () => console.info("MongoDB connected successfully"));
        mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err));

        // Connect cleanly by passing dbName as an option
        await mongoose.connect(uri, {
            dbName: dbName,
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
};

export default connectDb;
