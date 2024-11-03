import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncfunction.js";
import { ApiError } from "../utils/apiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createtweet=asyncHandler(async(req,res)=>{
    const {content}=req.body;
    if(!content){
        throw new ApiError(404,"Content required");
    }

    const tweet=await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new ApiError(400,"Error creating tweet");
    }

    return res.status(200).json(new ApiResponse(200,tweet,"Tweet created successfully"));
})

const edittweet=asyncHandler(async(req,res)=>{
    const {tweet_id}=req.params;
    const {content}=req.body;

    if(!isValidObjectId(tweet_id)){
        throw new ApiError(400,"Invalid tweet id");
    }
    
    if(!content){
        throw new ApiError(400,"Content required");
    }

    const tweet=await Tweet.findById(tweet_id);
    if(!tweet){
        throw new ApiError(400,"Tweet not found");
    }

    if(tweet.owner.toString()!==req.user?._id){
        throw new ApiError(400,"Only owner can edit it");
    }

    const newtweet= await Tweet.findByIdAndUpdate(tweet_id,{
        $set:{
            content:content
        }
    },{new: true})

    if(!newtweet){
        throw new ApiError(400,"Error creating tweet");
    }

    return res.status(200).json(new ApiResponse(200,newtweet,"Tweet edited successfully"));
})

const deletetweet=asyncHandler(async(req,res)=>{
    const {tweet_id}=req.params;
    
    if(!isValidObjectId(tweet_id)){
        throw new ApiError(400,"Invalid tweet");
    }

    const tweet=await Tweet.findById(tweet_id);
    if(!tweet){
        throw new ApiError(400,"Tweet not found");
    }

    if(tweet.owner.toString()!==req.user?._id){
        throw new ApiError(400,"Only owner can delete the tweet");
    }

    await Tweet.findByIdAndDelete(tweet_id);

    return res.status(200).json(new ApiResponse(200,{tweet_id},"Tweet deleted successfully"));
})

const getuserdetails=asyncHandler(async(req,res)=>{
    const {userid}=req.params;
    if(!isValidObjectId(userid)){
        throw new ApiError(400,"User not found");
    }

    const tweets=await Tweet.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(userid),
        },
    },
    {
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner_info",
            pipeline:[
                {
                    $project:{
                        username: 1,
                        "avatar.url": 1,
                    },
                },
            ],
        },
    },
    {
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "tweet",
            as: "liked_info",
            pipeline: [
                {
                    $project:{
                        likedby: 1,
                    },
                },
            ],
        },
    },
    {
        $addFields:{
            likescount:{
                $size: "$liked_info",
            },
            owner_info:{
                $first: "$owner_info",
            },
            isLiked:{
                $cond:{
                    if: {$in: [req.user?._id,"$liked_info.likedby"]},
                    then: true,
                    else: false
                },
            },
        },      
    },
    {
        $sort:{
            createdAt: -1
        }
    },
    {
        $project:{
            content: 1,
            owner_info: 1,
            likescount: 1,
            createdAt : 1,
            isLiked: 1,
        },
    },
])

return res.status(200).json(new ApiResponse(200,tweets,"Tweets fetched successfully"));
});

export {createtweet,deletetweet,edittweet,getuserdetails};