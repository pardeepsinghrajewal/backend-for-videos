import config from "./config.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

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
