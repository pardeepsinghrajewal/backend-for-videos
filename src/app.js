import express from "express";
import cors from "cors";
import config from "./config.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: config.JSON_LIMIT }));
app.use(express.urlencoded({ limit: config.URL_LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// import route
import userRoute from "./routes/user.route.js";

// route binding
app.use("/users", userRoute);

export { app };
