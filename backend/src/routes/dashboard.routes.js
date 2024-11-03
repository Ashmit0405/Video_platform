import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getchannelstats, getchannelvideos } from "../controllers/dashboard.controller.js";

const router=Router()
router.route("/stats").get(verifyJWT,getchannelstats);
router.route("/videos").get(verifyJWT,getchannelvideos);
export default router;