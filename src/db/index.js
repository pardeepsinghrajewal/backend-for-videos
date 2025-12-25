import mongoose from "mongoose";
import config from "../config.js";

const connectDB = async () => {
    try {
        const mogodb_connection = await mongoose.connect(`${config.MONGODB_URI}/${config.DB_NAME}`);
        console.log("* Successfully connected to mogodb ! *");
    } catch (error) {
        console.log("* Error in mogodb connection *", error);
        process.exit(1);
    }
};
export default connectDB;
