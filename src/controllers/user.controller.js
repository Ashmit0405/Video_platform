import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncfunction.js"
import { User } from "../models/user.model.js"
import { uploadfile } from "../utils/fileUpload.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        const res = await user.save({ validateBeforeSave: false })
        if (!res) {
            throw new ApiError(504, "Tokens not saved");
        }
        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while generating referesh and access token")
    }
}

const registeruser = asyncHandler(async (req, res) => {
    const { fullname, username, email, password } = req.body
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existeduser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existeduser) {
        throw new ApiError(409, "Email or username already exists");
    }
    const avatarlocalpath = req.files?.avatar[0]?.path
    const coverImagelocalpath = req.files?.coverImage[0]?.path
    if (!avatarlocalpath) {
        throw new ApiError(400, "Avatar file path is required")
    }
    const avatar = await uploadfile(avatarlocalpath)
    const coverImage = await uploadfile(coverImagelocalpath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createduser) {
        throw new ApiError(500, "Something went wrong while creating user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User created successfully")
    )

})

const loginuser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body
    if (!email && !username) {
        throw new ApiError(400, "Username or email is required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }
    const passvalid = await user.ispasswordcorrect(password);
    if (!passvalid) throw new ApiError(400, "Password not correct");

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
})

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1,
        }
    }, {
        new: true,
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logout successful"))
})

const refreshaccesstoken=asyncHandler(async(req,res)=>{
    const incomrefresh=req.cookies.refreshToken||req.body.refreshToken
    if(!incomrefresh){
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedtoken=jwt.verify(incomrefresh,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedtoken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh token");
        }
    
        if(incomrefresh!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options={
            httpOnly: true,
            secure: true
        };
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(new ApiResponse(200,{accessToken,refreshToken: newRefreshToken},"Access Token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refresh Token")
    }
})

const changepass=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
    const iscorrect=await user.ispasswordcorrect(oldpassword)
    if(!iscorrect){
        throw new ApiError(400,"Invalid old Password");
    }
    user.password=newpassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getcurruser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"));
})

const updateAccountdetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if (!(fullname||email)) {
        throw new ApiError(401,"All fields are required");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Details updated successfully"));
})

const update_avatar=asyncHandler(async(req,res)=>{
    const avatarlocalpath=req.file?.path;
    if(!avatarlocalpath){
        throw new ApiError(401,"Avatar not present");
    }
    const avatar=await uploadfile(avatarlocalpath);
    if(!avatar.url){
        throw new ApiError(401,"Error while uploading avatar");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url,
        }
    },{new: true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"));
})

const update_coverImage=asyncHandler(async(req,res)=>{
    const coverImagelocalpath=req.file?.path;
    if(!coverImagelocalpath){
        throw new ApiError(401,"CoverImage not present");
    }
    const coverImage=await uploadfile(coverImagelocalpath);
    if(!coverImage.url){
        throw new ApiError(401,"Error while uploading coverImage");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url,
        }
    },{new: true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successfully"));
})

const getprofile=asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400,"Username not found");
    }
    const channel=await User.aggregate([{
        $match:{
            username:username?.toLowerCase()
        }
    },{
        $lookup:{
            from: "Subscription",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },{
        $lookup:{
            from: "Subscription",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribed"
        }
    },{
        $addFields:{
            subscriberscount:{
                $size:"$subscribers"
            },
            subscribedto:{
                $size:"$subscribed"
            },
            issubscribed:{
                $condition:{
                    if:{$in: [req.user?._id,"subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },{
        $project:{
            fullname: 1,
            username: 1,
            subscriberscount: 1,
            subscribedto: 1,
            issubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
        }
    }
])
    if(!channel?.length){
        throw new ApiError(400,"Channel not exist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
})

const getwatchhistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id),
            }
        },{
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch History fetched."))
})

export { registeruser, loginuser, logout,refreshaccesstoken,changepass,getcurruser,updateAccountdetails,update_avatar,update_coverImage,getprofile,getwatchhistory }