import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changePassword,
    getCurrentUser,
    updateAccountInfo,
    updateAvatar,
} from "../controllers/user.controller.js";

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
userRoute.route("/logout").get(verifyJWT, logoutUser);
userRoute.route("/refresh-token").post(refreshToken);
userRoute.route("/change-password").post(verifyJWT, changePassword);
userRoute.route("/get-current").get(verifyJWT, getCurrentUser);
userRoute.route("/update-account").post(verifyJWT, updateAccountInfo);
userRoute.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateAvatar);

export default userRoute;
