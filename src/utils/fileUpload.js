import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET  
})

const uploadfile=async (localpath)=>{
    try {
        if (!localpath) {
            return null
        } 
        const upload=await cloudinary.uploader.upload(localpath,{
            resource_type:"auto",
        });
        console.log("File is uploaded.",upload.url)
        fs.unlinkSync(localpath)
        return upload
    } catch (error) {
        fs.unlinkSync(localpath)
        return null
    }
}

const deletefile=async(public_id,resource_type="image")=>{
    try{
        if(!public_id) return null

        const res=await cloudinary.uploader.destroy(public_id,{
            resource_type: `${resource_type}`
        });
        return res;
    }
    catch(error){
        console.log("Upload Failed on Cloudinary")
        return error;
    }
}

export {uploadfile,deletefile}