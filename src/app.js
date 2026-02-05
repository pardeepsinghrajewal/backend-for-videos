import express from "express";
import cors from "cors";
import config from "./config.js";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: config.JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: config.URL_LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// import route
import userRoute from "./routes/user.route.js";
import videoRoute from "./routes/video.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import commentRouter from "./routes/comment.route.js";
import playlistRoute from "./routes/playlist.route.js";

// route binding
app.use("/api/v1/users", userRoute);
app.use("/api/v1/video", videoRoute);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRoute);

app.use(errorHandler);

export { app };
