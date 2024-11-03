import mongoose from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncfunction.js";
import { ApiError } from "../utils/apiError.js";

const healthcheck =asyncHandler(async (req,res)=>{
    try {
        const dbstatus=mongoose.connection.readyState==1?"Connected":"Not Connected";
        if(dbstatus==="Connected") return res.status(200).json(new ApiResponse(200,{message: `Everything working fine, Db status: ${dbstatus}`},"O.K."))
        else throw new ApiError(500,"Database not functional");
    } catch (error) {
        console.log(error);
    }
})

export {healthcheck}