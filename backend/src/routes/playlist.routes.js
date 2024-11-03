import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addvideo, createplaylist, deleteplaylist, getplaylist, getuserplaylist, removevideo, updateplaylist } from "../controllers/playlist.controller.js";

const router=Router();
router.use(verifyJWT);
router.route("/").post(createplaylist);
router.route("/:playlistid").get(getplaylist).patch(updateplaylist).delete(deleteplaylist);
router.route("/add/:vid/:playlistid").patch(addvideo);
router.route("/remove/:vid/:playlistid").patch(removevideo);
router.route("/user/:playlistid").get(getuserplaylist);
export default router