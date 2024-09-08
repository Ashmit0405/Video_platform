import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
        console.log(`\n Mongo DB connected || DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongo connection error",error);
        process.exit(1);
    }
}
export default connectDB;