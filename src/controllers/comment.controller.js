import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncfunction.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.model.js";

const getcomments=asyncHandler(async (req,res)=>{
    const {videoId}=req.params;
    const {page=1,limit=10}=req.query;

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video Not Found");
    }

    const commenta=Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "comment_owner"
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "comment_likes"
            }
        },
        {
            $addFields:{
                likescount:{
                    $size: "$comment_likes"
                },
                owner:{
                    $first: "$comment_owner"
                },
                isLiked:{
                    $cond:{
                        if: {$in: [req.user?._id,"$comment_likes.likedby"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                likescount: 1,
                owner:{
                    username: 1,
                    fullname: 1,
                    "avatar.url":1
                },
                isLiked: 1
            }
        }
    ])

    const options={
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    }

    const comments=await Comment.aggregatePaginate(commenta,options);

    return res.status(200).json(new ApiResponse(200,comments,"Comments returned Successfully"))
})

const addComment=asyncHandler(async (req,res)=>{
    const {videoId}=req.params
    const {content}=req.body

    if(!content){
        throw new ApiError(404,"Comment not added")
    }

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    const comment=await Comment.create({content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment){
        throw new ApiError(404,"Comment not created")
    }

    return res.status(200).json(new ApiResponse(200,"Comment added successfully"));
})

const editcomment=asyncHandler(async (req,res)=>{
    const {commentid}=req.params;
    const {newcomment}=req.body;

    if(!newcomment){
        throw new ApiError(404,"No content found");
    }

    const comment=await Comment.findById(commentid);
    if(!comment){
        throw new ApiError(404,"No comment found");
    }

    const updated=await Comment.findByIdAndUpdate(commentid,{
        $set:{
            content: newcomment
        }
    },{new: true})

    if(!updated){
        throw new ApiError(404,"Error updating comment")
    }

    return res.status(200).json(new ApiResponse(200,"Comment edited successfully"));
})

const deletecomment=asyncHandler(async(req,res)=>{
    const {commentid}=req.params;
    const comment=await Comment.findById(commentid);

    if(!comment){
        throw new ApiError(404,"Comment not found");
    }

    if(comment?.owner.toString()!==req.user){
        throw new ApiError(404,"Not authorised to delete");
    }

    await Comment.findByIdAndDelete(commentid)

    await Like.deleteMany({
        comment: commentid,
        likedby: req.user?._id
    })

    return res.status(200).json(new ApiResponse(200,"Comment deleted successfully"));
})

export {getcomments,addComment,editcomment,deletecomment};