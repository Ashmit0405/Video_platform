import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncfunction.js";
import { ApiError } from "../utils/apiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const togglev_likes=asyncHandler(async (req,res)=>{
    const {v_id}=req.params;
    if(!isValidObjectId(v_id)){
        throw new ApiError(404,"Invalid id")
    }

    const likedstatus= await Like.findOne({
        video: v_id,
        likedby: req.user?._id
    })

    if(likedstatus){
        await Like.findByIdAndDelete(likedstatus?._id)
        return res.status(200).json(new ApiResponse(200,"Liked Removed Successfully"));
    }

    const test=await Like.create({
        video: v_id,
        likedby: req.user?._id
    })

    return res.status(200).json(new ApiResponse(200,test,"Liked Added Successfully"))
})

const togglec_likes=asyncHandler(async(req,res)=>{
    const {c_id}=req.params;
    if(!isValidObjectId(c_id)){
        throw new ApiError(404,"Comment not found")
    }

    const likestatus=await Like.findOne({
        comment: c_id,
        likedby: req.user?._id
    })

    if(likestatus){
        const test=await Like.findByIdAndDelete(likestatus?._id)
        return res.status(200).json(new ApiResponse(200,test,"Likes Removed Successfully"))
    }

    const test=await Like.create({
        comment: c_id,
        likedby: req.user?._id
    })

    return res.status(200).json(new ApiResponse(200,test,"Comment Liked successfully"))
})

const togglet_likes=asyncHandler(async(req,res)=>{
    const {t_id}=req.params
    if(!isValidObjectId(t_id)){
        throw new ApiError(404,"Tweet Not found");
    }

    const likedstatus=await Like.findOne({
        tweet: t_id,
        likedby: req.user?._id
    })

    if(likedstatus){
        await Like.findByIdAndDelete(likedstatus?._id);
        return res.status(200).json(new ApiResponse(200,"Liked Removed Successfully"));
    }

    await Like.create({
        tweet: t_id,
        likedby: req.user?._id
    })

    return res.status(200).json(new ApiResponse(200,"Liked Successfully"));
})

const getliked_videos=asyncHandler(async(req,res)=>{
    const likedvideo=await Like.aggregate([
        {
            $match:{
                likedby: mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "liked_video"
            },
            pipeline:[
                {
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    },
                },
                {
                    $unwind: "$owner",   
                }
            ],
        },
        {
            $unwind: "$liked_video",
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                $id: 0,
                liked_video:{
                    _id: 1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    createdAt: 1,
                    owner:{
                        username: 1,
                        fullname: 1,
                        "avatar.url": 1
                    }
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,likedvideo,"Liked Videos fetched successfully"));
})

export {getliked_videos,togglec_likes,togglet_likes,togglev_likes};