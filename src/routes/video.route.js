import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    addVideo,
    getVideoById,
    toggleVideoStatus,
    updateVideo,
    getVideos,
    deleteVideo,
    updateVideoThumbnail,
    watchVideo,
} from "../controllers/video.controller.js";
import { uploadImage, uploadImagesAndVideos } from "../middlewares/multer.middleware.js";

const videoRoute = Router();

videoRoute.use(verifyJWT); // enable on all routes.

videoRoute.route("/add").post(
    uploadImagesAndVideos({
        fields: [
            { name: "video", type: "video", maxCount: 1 },
            { name: "thumbnail", type: "image", maxCount: 1 },
        ],
    }),
    addVideo
);

videoRoute.route("/all").get(getVideos);
videoRoute.route("/update").patch(updateVideo);
videoRoute.route("/update-thumbnail").patch(uploadImage.single("thumbnail"), updateVideoThumbnail);

/** dynamic route will at bottom  **/
videoRoute.route("/:id").get(getVideoById);

videoRoute.route("/toggle-status/:id").patch(toggleVideoStatus);

videoRoute.route("/:id").delete(deleteVideo);

videoRoute.route("/watch/:id").get(watchVideo);

export default videoRoute;
