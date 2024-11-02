import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getallvideos,getvideobyid,publishvideo,deletevideo,updatevideo,togglepublishstatus} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
const router=Router();
router.use(verifyJWT);
router.route("/").get(getallvideos).post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),publishvideo)
router.route("/:videoid").get(getvideobyid).delete(deletevideo).patch(upload.single("thumbnail"),updatevideo);
router.route("/toggle/publish/:videoid").patch(togglepublishstatus);
export default router;