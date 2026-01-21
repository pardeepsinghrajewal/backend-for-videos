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
    updateCoverImage,
    getAllUsers,
    deleteUser,
    changePasswordWithoutOldPassword,
} from "../controllers/user.controller.js";

import { upload, uploadImage, uploadImagesAndVideos } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const userRoute = Router();

// userRoute.route("/register").post(
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1,
//         },
//         {
//             name: "coverImage",
//             maxCount: 1,
//         },
//     ]),
//     registerUser
// );

userRoute.route("/register").post(
    uploadImagesAndVideos({
        fields: [
            { name: "avatar", type: "image", maxCount: 1 },
            { name: "coverImage", type: "image", maxCount: 1 },
        ],
    }),
    registerUser
);

userRoute.route("/login").post(loginUser);

/** secured route **/
userRoute.route("/logout").get(verifyJWT, logoutUser);
userRoute.route("/refresh-token").post(refreshToken);
userRoute.route("/change-password").patch(verifyJWT, changePassword);
userRoute.route("/get-current").get(verifyJWT, getCurrentUser);
userRoute.route("/update-account").patch(verifyJWT, updateAccountInfo);
// userRoute.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
// userRoute.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

userRoute.route("/update-avatar").patch(verifyJWT, uploadImage.single("avatar"), updateAvatar);
userRoute.route("/update-cover-image").patch(verifyJWT, uploadImage.single("coverImage"), updateCoverImage);

userRoute.route("/get-all").get(getAllUsers);
userRoute.route("/delete").delete(verifyJWT, deleteUser);
userRoute.route("/change-password-without-old-password").patch(changePasswordWithoutOldPassword);

export default userRoute;
