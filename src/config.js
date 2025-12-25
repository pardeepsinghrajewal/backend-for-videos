import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});
const config = {
    PORT: 8000,
    DB_NAME: "videos-backend",
    MONGODB_URI: String(process.env.MONGODB_URI),
};
export default config;
