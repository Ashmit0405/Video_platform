import { Router } from "express";
import { changepass, getcurruser, getprofile, getwatchhistory, loginuser, logout, refreshaccesstoken, registeruser, update_avatar, update_coverImage, updateAccountdetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userrouter=Router();

userrouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registeruser)

userrouter.route("/login").post(loginuser);

userrouter.route("/logout").post(verifyJWT,logout);
userrouter.route("/refresh-Token").post(refreshaccesstoken)
userrouter.route("/change-password").post(verifyJWT,changepass)
userrouter.route("/current-user").get(verifyJWT,getcurruser)
userrouter.route("/update-details").patch(verifyJWT,updateAccountdetails)
userrouter.route("/avatar").patch(verifyJWT,upload.single("avatars"),update_avatar)
userrouter.route("/coverimage").patch(verifyJWT,upload.single("Coverimage"),update_coverImage)
userrouter.route("/c/:username").get(verifyJWT,getprofile)
userrouter.route("/watch-history").get(verifyJWT,getwatchhistory)
export default userrouter