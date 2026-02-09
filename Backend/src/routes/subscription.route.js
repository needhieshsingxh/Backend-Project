import {Router} from "express";
import {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle/:channelId").post(verifyJWT, toggleSubscription);
router.route("/channel/:channelId").get(getUserChannelSubscribers);
router.route("/user/:subscriberId").get(getSubscribedChannels);

export default router;