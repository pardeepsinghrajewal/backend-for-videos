import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { addVideo, getVideoById } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRoute = Router();

videoRoute.use(verifyJWT);

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

videoRoute.route("/:id").get(getVideoById);

export default videoRoute;
