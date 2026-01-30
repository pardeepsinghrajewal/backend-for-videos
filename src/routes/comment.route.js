import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { addComment, removeComment, updateCommnet, getAllComments } from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter
    .route("/")
    .post(verifyJWT, addComment)
    .get(getAllComments)
    .patch(verifyJWT, updateCommnet)
    .delete(verifyJWT, removeComment);

export default commentRouter;
