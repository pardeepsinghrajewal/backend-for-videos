import config from "./config.js";
import express from "express";
import connectDB from "./db/index.js";

const app = express();

connectDB()
    .then(() => {
        app.listen(config.PORT, () => {
            console.log(`app url is http://localhost:${config.PORT}`);
        });
    })
    .catch((error) => console.log("* error *", error))
    .finally(() => console.log("* finally *"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});
