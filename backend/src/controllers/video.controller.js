import mongoose, {isValidObjectId} from "mongoose";
import {asyncHandler}  from "../utils/asyncfunction.js"
import {ApiError} from "../utils/apiError.js"
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadfile,deletefile } from "../utils/fileUpload.js";
import { User } from "../models/user.model.js";
import {Like} from "../models/like.model.js";
import {Comment} from "../models/comment.model.js"
const getallvideos=asyncHandler(async (req,res)=>{
    const {page=1,limit=10,query,sortby,sorttype,userid}=req.query;
    const pipeline=[]
    if(query){
        pipeline.push({
            $search:{
                index: "video-search",
                text:{
                    query: query,
                    path: ["title","description"]
                }
            }
        })
    }
    if(userid){
        if(!isValidObjectId(userid)){
            throw new ApiError(400,"Invalid user Id");
        }
        pipeline.push({
            $match:{
                owner: new mongoose.Types.ObjectId(userid)
            }
        })
    }

    pipeline.push({
        $match:{
            isPublished: true,
        }
    })

    if(sortby&&sorttype){
        pipeline.push({
            $sort:{
                [sortby]: sorttype=="asc"?1:-1,
            }
        })
    }else{
        pipeline.push({
            $sort:{
                createdAt: -1,
            }
        })
    }

    pipeline.push({
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner_details",
            pipeline:[
                {
                    $project:{
                        username: 1,
                        "avatar.url": 1
                    }
                }
            ]
        }
    },
    {
        $unwind: "$owner_details"
    }
)
    const v_agg= Video.aggregate(pipeline)
    const options={
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    };
    const video=await Video.aggregatePaginate(v_agg,options)

    return res.status(200).json(new ApiResponse(200,video,"All videos fetched successfully"));
})

const publishvideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    if(!title||!description){
        throw new ApiError(400,"All fields required");
    }

    const vidfile=req.files?.videoFile[0].path;
    const thumbnail=req.files?.thumbnail[0].path;
    if(!vidfile){
        throw new ApiError(400,"Video file is required");
    }

    if(!thumbnail){
        throw new ApiError(400,"Thumbnail file is required");
    }

    const v_file=await uploadfile(vidfile);
    const t_file=await uploadfile(thumbnail);
    if(!v_file){
        throw new ApiError(400,"Video File Not Found");
    }
    if(!t_file){
        throw new ApiError(400,"Thumnbnail File Not Found");
    }

    const video=await Video.create({
        title: title,
        description: description,
        videoFile:{
            url: v_file,
            public_id: v_file.public_id
        },
        thumbnail:{
            url: t_file,
            public_id: t_file.public_id
        },
        duration: v_file.duration,
        isPublished: false,
        owner: req.user?._id
    })

    const uploaded_video=await Video.findById(video._id)
    if(!uploaded_video){
        throw new ApiError(400,"Error uploading Video");
    }
    
    return res.status(200).json(new ApiResponse(200,uploaded_video,"Video Uploaded Successfully"));
})

const getvideobyid=asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!isValidObjectId(videoid)){
        throw new ApiError(400,"Invalid Video Id");
    }
    if(!isValidObjectId(req.user?._id)){
        throw new ApiError(400,"Invalid User Id");
    }

    const video= await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoid)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $lookup:{
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribercount:{
                                $size: "$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    $if:{
                                        $in:[
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            username: 1,
                            "avatar.url":1,
                            subscribercount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likescount:{
                    $size:"$likes"
                },
                owner:{
                    $first: "$owner"
                },
                isLiked:{
                    $cond:{
                        $if:{
                            $in:[req.user?._id,"$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likescount: 1,
                isLiked: 1
            }
        }
    ])
    if(!video){
        throw new ApiError(400,"Error getting video");
    }

    await Video.findByIdAndUpdate(videoid,{
        $inc:{
            views: 1
        }
    })

    await User.findByIdAndUpdate(req.user?._id,{
        $addToSet:{
            watchHistory: videoid
        }
    })

    return res.status(200).json(new ApiResponse(200,video[0],"Video Fetched Successfully"));
})

const updatevideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    const {videoid}=req.params;
    if(!isValidObjectId(videoid)){
        throw new ApiError(400,"Invalid Video File");
    }

    if(!title||!description){
        throw new ApiError(400,"All fields required");
    }

    const video=await Video.findById(videoid);
    if(!video){
        throw new ApiError(400,"Video Not Found");
    }
    if(video?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Only the owner can edit this video");
    }

    const thumbnailtodelete=video.thumbnail.public_id;
    const thumbnaillocalpath=req.file?.path;
    if(!thumbnaillocalpath){
        throw new ApiError(400,"Thumbnail required");
    }
    const thumbnail=await uploadfile(thumbnaillocalpath);
    if(!thumbnail) throw new ApiError(400,"Error Uploading Thumbnail");
    const updatedvideo=await Video.findByIdAndUpdate(videoid,{
        $set:{
            title,
            description,
            thumbnail:{
                public_id:thumbnail.public_id,
                url: thumbnail.url
            }
        },
    },{new: true})
    if(!updatedvideo) throw new ApiError(400,"Error Updating Video");
    await deletefile(thumbnailtodelete);
    return res.status(200).json(new ApiResponse(200,updatedvideo,"Video Updated Successfully"));
})

const deletevideo=asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!isValidObjectId(videoid)) throw new ApiError(400,"Invalid Video ID");
    const video=await Video.findById(videoid);
    if(!video) throw new ApiError(400,"Video Not Found");
    if(video?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Can be done only the owner");
    }
    const video_delete=await Video.findByIdAndDelete(videoid);
    if(!video_delete){
        throw new ApiError(400,"Error deleting video");
    }
    await deletefile(video.thumbnail.public_id);
    await deletefile(video.videoFile.public_id,"video");
    await Like.deleteMany({
        video: videoid
    })
    await Comment.deleteMany({
        video: videoid
    })
    return res.status(200).json(new ApiResponse(200,"Video Deleted Successfully"));
})

const togglepublishstatus=asyncHandler(async(req,res)=>{
    const {videoid}=req.params;
    if(!isValidObjectId(videoid)) throw new ApiError(500,"Invalid Video ID");
    const video=await Video.findById(videoid);
    if(!video){
        throw new ApiError(400,"Video Not Found");
    }
    if(video?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Only The Owner can make changes");
    }
    const tooglepublish=await Video.findByIdAndUpdate(videoid,{
        $set:{
            isPublished: !video?.isPublished
        }
    },{new: true});
    if(!togglepublishstatus) throw new ApiError(400,"Error Toggleing the status");
    return res.status(200).json(new ApiResponse(200,tooglepublish,"Toggled Successfully"));
})
export {getallvideos,getvideobyid,publishvideo,deletevideo,togglepublishstatus,updatevideo};