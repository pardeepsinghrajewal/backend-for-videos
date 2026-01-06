import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});
const config = {
    PORT: 8000,
    DB_NAME: "videos-backend",
    MONGODB_URI: String(process.env.MONGODB_URI),
    CORS_ORIGIN: String(process.env.CORS_ORIGIN),
    ACCESS_TOKEN_SECRET: String(process.env.ACCESS_TOKEN_SECRET),
    ACCESS_TOKEN_EXPIRY: String(process.env.ACCESS_TOKEN_EXPIRY),
    REFRESH_TOKEN_SECRET: String(process.env.REFRESH_TOKEN_SECRET),
    REFRESH_TOKEN_EXPIRY: String(process.env.REFRESH_TOKEN_EXPIRY),
    CLOUDINARY_CLOUD_NAME: String(process.env.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: String(process.env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: String(process.env.CLOUDINARY_API_SECRET),
    JSON_LIMIT: "16KB",
    URL_LIMIT: "16KB",
    NODE_ENV: String(process.env.NODE_ENV),
};
export default config;
