import mongoose,{isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncfunction.js";
import { ApiError } from "../utils/apiError.js";
import {Subscription} from "../models/subscription.model.js"


const togglesubscription=asyncHandler(async(req,res)=>{
    const {channelid}=req.params;
    if(!isValidObjectId(channelid)){
        throw new ApiError(400,"Invalid channel id");
    }

    const issubsribed=await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelid,
    })

    if(issubsribed){
        await Subscription.findByIdAndDelete(issubsribed?._id);
        return res.status(200).json(200,{subcribed: false},"Unsubscribed Successfully");
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelid,
    })

    return res.status(200).json(200,{subscribed:true},"Subscribed Successfully");
})

const getchannelsubs=asyncHandler(async(req,res)=>{
    let {channelid}=req.params;

    if(!isValidObjectId(channelid)){
        throw new ApiError(400,"Not a valid channel");
    }

    channelid=new mongoose.Types.ObjectId(channelid);

    const subs=await Subscription.aggregate([
        {
            $match:{
                channel: channelid,
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline:[
                    {
                        $lookup:{
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedTo"
                        }
                    },
                    {
                        $addFields:{
                            subscribedTo:{
                                $cond:{
                                    if:{
                                        $in:[
                                            channelid,
                                            "$subscribedTo.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                            subscribercount:{
                                $size: "$subscribedTo",
                            }
                        }
                    }
                ],
            },
        },
        {
            $unwind:"$subscriber",
        },
        {
            $project:{
                _id: 0,
                subscriber:{
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    "avatar.url": 1,
                    subscribedTo: 1,
                    subscribercount: 1,
                }
            }
        }
    ]);

    return res.status(200).json(200,subs,"Subscribers Fetched Successfully");
});

const getchannels=asyncHandler(async(req,res)=>{
    const {subid}=req.params;

    const subbedchannels=await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subid),
            }
        },
        
    ])
})