import mongoose,{Schema} from "mongoose";

const likesschema=new Schema({
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedby:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Like=mongoose.model("Like",likesschema)