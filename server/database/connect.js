const mongoose = require("mongoose");
async function connectMongo() {
    try {
        mongoose.set("autoIndex", true);
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected at", conn.connection.host);
    } catch (err) {
        console.log("MongoDB connection error.");
        process.exit(1);
    }
}
module.exports = connectMongo;