import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncfunction.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        console.log(req)
        const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer","")
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decoded?._id).select("-password-refreshToken");
        if(!user){
            throw new ApiError(401,"Invalid Access Token");
        }
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(504,error?.message ||"Invalid access token");
    }
})