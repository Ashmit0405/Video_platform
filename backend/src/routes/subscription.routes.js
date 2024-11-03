import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getchannels, getchannelsubs, togglesubscription } from "../controllers/subscription.controller.js";

const router=Router()
router.use(verifyJWT);
router.route("/c/:channelid").get(getchannelsubs).post(togglesubscription);
router.route("u/:subid").get(getchannels);
export default router;