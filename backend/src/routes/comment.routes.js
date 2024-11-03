import { Router } from "express";
import { addComment, deletecomment, editcomment, getcomments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();
router.route("/:videoid").get(verifyJWT,getcomments).post(verifyJWT,addComment);
router.route("/c/:commentid").delete(verifyJWT,deletecomment).patch(verifyJWT,editcomment);
export default router;