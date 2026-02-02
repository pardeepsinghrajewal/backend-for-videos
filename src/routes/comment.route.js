import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { addComment, removeComment, updateCommnet, getComments } from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter.route("/").get(getComments).post(verifyJWT, addComment).patch(verifyJWT, updateCommnet);
commentRouter.route("/:id").delete(verifyJWT, removeComment);

export default commentRouter;
