import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncfunction";
import { Subscription } from "../models/subscription.model";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/apiResponse";

const getchannelstats=asyncHandler(async (req,res)=>{
    const userId=req.user?._id;

    const totalsubs=await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(userId)  
            }
        },
        {
            $group:{
                _id:null,
                subscribercount:{
                    $sum: 1
                }
            }
        }
    ])

    const video=await Video.aggregate([
        {
            $match:{
                owner: mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "video_likes"
            }
        },
        {
            $project:{
                total_likes:{
                    $size:"likes"
                },
                total_views:"$views",
                total_videos:1
            }
        },
        {
            $group:{
                _id: null,
                total_likes:{
                    $sum: "$total_likes"
                },
                total_views:{
                    $sum: "$total_views"
                }
                ,
                total_videos:{
                    $sum: 1
                },
            }
        }
    ]);

    const channelstats={
        totalsubs: totalsubs[0]?.subscribercount||0,
        total_likes: video[0]?.total_likes||0,
        total_videos: video[0]?.total_videos||0,
        total_views: video[0]?.total_views||0
    };

    return res.status(200).json(new ApiResponse(200,channelstats,"Fetched Channel stats successfully"));
})

const getchannelvideos=asyncHandler(async (req,res)=>{
    const userId=req.user?._id;
    const videos=await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "v_likes"
            }
        },
        {
            $addFields:{
                createdAt:{
                    $dateToParts:{date:"$createdAt"}
                },
                likes_count:{
                    $sum:"$v_likes"
                }
            }
        },
        {
            $sort:{
                createdAt:-1,
            }
        },
        {
            $project:{
                _id:1,
                "videoFile.url":1,
                "thumbnail.url":1,
                title:1,
                description:1,
                createdAt:{
                    year:1,
                    month:1,
                    day:1,
                },
                isPublished:1,
                likes_count:1
            }
        }
    ])
    
    return res.status(200).json(new ApiResponse(200,videos,"All channel videos fetched successfully"));
})

export {getchannelstats,getchannelvideos};