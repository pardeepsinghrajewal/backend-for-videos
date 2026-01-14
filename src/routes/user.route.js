import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshToken, changePassword } from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const userRoute = Router();

userRoute.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

userRoute.route("/login").post(loginUser);

/** secured route **/

userRoute.route("/logout").post(verifyJWT, logoutUser);
userRoute.route("/refresh-token").post(refreshToken);
userRoute.route("/change-password").post(verifyJWT, changePassword);

export default userRoute;
