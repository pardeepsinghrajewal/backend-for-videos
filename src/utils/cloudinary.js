import { v2 as cloudinary } from "cloudinary";
import config from "../config.js";
import fs from "fs";

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) return null;

        const uploadResult = await cloudinary.uploader.upload(localPath, { resource_type: "auto" }).catch((error) => {
            console.log("uploadOnCloudinary has error: ", error);
        });
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
        return uploadResult;
    } catch (error) {
        console.log("Error in uploadOnCloudinary : ", error);
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
        return null;
    }
};

export { uploadOnCloudinary };
