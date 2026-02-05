import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    addComment,
    removeComment,
    updateCommnet,
    getComments,
    getComment,
} from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter.route("/").get(getComments).post(verifyJWT, addComment);
/** dynamic route will at bottom  **/
commentRouter.route("/:id").get(verifyJWT, getComment).delete(verifyJWT, removeComment).patch(verifyJWT, updateCommnet);

export default commentRouter;
