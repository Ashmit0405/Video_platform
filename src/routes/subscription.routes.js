import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getchannels, getchannelsubs, togglesubscription } from "../controllers/subscription.controller";

const router=Router()
router.use(verifyJWT);
router.route("/c/:channelid").get(getchannelsubs).post(togglesubscription);
router.route("u/:subid").get(getchannels);
export default router;