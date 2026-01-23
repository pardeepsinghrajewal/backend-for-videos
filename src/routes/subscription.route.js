import { Router } from "express";
import { toggleSubscription } from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const subscriptionRoute = Router();

subscriptionRoute.use(verifyJWT);

subscriptionRoute.route("/toggle").post(verifyJWT, toggleSubscription);

export default subscriptionRoute;
