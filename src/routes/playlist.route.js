import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    createPlayList,
    getPlayList,
    updatePlayList,
    deletePlayList,
    addVideoToPlayList,
    removeVideoFromPlayList,
} from "../controllers/playlist.controller.js";

const playlistRoute = Router();

playlistRoute.use(verifyJWT);
playlistRoute.route("/").post(createPlayList);

/** dynamic route will at bottom  **/
playlistRoute.route("/:id").get(getPlayList).patch(updatePlayList).delete(deletePlayList);
playlistRoute.route("/:id/videos").post(addVideoToPlayList);
playlistRoute.route("/:id/videos").delete(removeVideoFromPlayList);

export default playlistRoute;
