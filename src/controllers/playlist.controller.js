import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncfunction";
import { ApiError } from "../utils/apiError";
import { Playlist } from "../models/playlist.model";
import { ApiResponse } from "../utils/apiResponse";


const createplaylist=asyncHandler(async(req,res)=>{
    const {name,description}=req.body;

    if(!name||!description){
        throw new ApiError(500,"Name and Description required");
    }

    const playlist=await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id,
    });

    if(!playlist){
        throw new ApiError(500,"Error in making playlist");
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully"));
})

const updateplaylist=asyncHandler(async(req,res)=>{
    const {name,description}=req.body;
    const {p_id}=req.params;
    
    if(!name||!description){
        throw new ApiError(500,"Name and Description required");
    }

    if(!isValidObjectId(p_id)){
        throw new ApiError(500,"Invalid Playlist");
    }

    const playlist=await Playlist.findById(p_id);
    if(!playlist){
        throw new ApiError(500,"Playlist Not Found");
    }

    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(500,"Only Playlist owner can edit");
    }

    const upplaylist= await Playlist.findByIdAndUpdate(playlist._id,{
        $set:{
            name: name,
            description: description
        },
    },{new: true})

    if(!upplaylist){
        throw new ApiError(500,"Error updating playlist");
    }

    return res.status(200).json(new ApiResponse(200,upplaylist,"Playlist updated successfully"));

})

const deleteplaylist=asyncHandler(async(req,res)=>{
    const {p_id}=req.params;
    if(!isValidObjectId(p_id)){
        throw new ApiError(500,"Playlist Not Found");
    }
    
    const playlist=Playlist.findById(p_id);
    if(!playlist){
        throw new ApiError(404,"Playlist Not found");
    }
    if(playlist.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(500,"Only creator of the playlist can make changes");
    }
    const response=await Playlist.findByIdAndDelete(p_id);
    if(!response){
        throw new ApiError(500,"Error deleting playlist");
    }

    return res.status(200).json(new ApiResponse(200,response,"Playlist Deleted Successfully"));
});

const addvideo=asyncHandler(async(req,res)=>{
    
})