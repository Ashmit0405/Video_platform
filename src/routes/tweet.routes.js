import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createtweet, deletetweet, edittweet, getuserdetails } from "../controllers/tweet.controller";

const router=Router();
router.use(verifyJWT);
router.route("/").post(createtweet);
router.route("/user/:userid").get(getuserdetails);
router.route("/:tweet_id").patch(edittweet).delete(deletetweet);
export default router;