import { Router } from "express";
import {
    getSubscription,
    getSubscriptions,
    toggleSubscription,
    getSubscribedChannelsOfUser,
    getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const subscriptionRoute = Router();

subscriptionRoute.use(verifyJWT);

subscriptionRoute.route("/").get(getSubscriptions);
subscriptionRoute.route("/subscribed-channels-of-user").get(getSubscribedChannelsOfUser);
subscriptionRoute.route("/channel-subscribers").get(getChannelSubscribers);

/** dynamic route will at bottom  **/
subscriptionRoute.route("/:id").get(getSubscription);
subscriptionRoute.route("/toggle/:channelID").patch(toggleSubscription);

export default subscriptionRoute;
