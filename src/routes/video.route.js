import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    addVideo,
    getVideoById,
    toggleVideoStatus,
    updateVideo,
    getAllVideos,
    deleteVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRoute = Router();

videoRoute.use(verifyJWT); // enable on all routes.

videoRoute.route("/add").post(
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    addVideo
);

videoRoute.route("/update-video").patch(updateVideo);

videoRoute.route("/all").get(getAllVideos);

/** dynamic route will at bottom  **/
videoRoute.route("/:id").get(getVideoById);

videoRoute.route("/toggle-status/:id").get(toggleVideoStatus);

videoRoute.route("/:id").delete(deleteVideo);

export default videoRoute;
