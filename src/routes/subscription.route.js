import { Router } from "express";
import {
    toggleSubscription,
    getSubscribedChannelsOfUser,
    getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const subscriptionRoute = Router();

subscriptionRoute.use(verifyJWT);

subscriptionRoute.route("/toggle").post(toggleSubscription);
subscriptionRoute.route("/subscribed-channels-of-user").get(getSubscribedChannelsOfUser);
subscriptionRoute.route("/channel-subscribers").post(getChannelSubscribers);

export default subscriptionRoute;
