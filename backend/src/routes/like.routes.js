import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getliked_videos, togglec_likes, togglet_likes, togglev_likes } from "../controllers/like.controller.js";

const router=Router();
router.route("/toggle/v/:v_id").post(verifyJWT,togglev_likes);
router.route("/toggle/v/:c_id").post(verifyJWT,togglec_likes);
router.route("/toggle/v/:t_id").post(verifyJWT,togglet_likes);
router.route("/likedvideos").get(verifyJWT,getliked_videos);
export default router;