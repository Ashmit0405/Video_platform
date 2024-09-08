import mongoose,{ Schema } from "mongoose";

const subs_schema=new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})


export const Subscription=mongoose.model("Subscription",subs_schema)