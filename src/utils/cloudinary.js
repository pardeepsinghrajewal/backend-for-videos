import { v2 as cloudinary } from "cloudinary";
import config from "../config.js";
import fs from "fs";
import { ApiError } from "./apiError.js";

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

const removeFromCloudinary = async (public_id, resource_type = "image") => {
    try {
        if (!public_id) {
            throw new ApiError(500, "Public ID of assert is missing while removing from cloudinary! ");
        }
        const result = await cloudinary.uploader.destroy(public_id, { resource_type });
        return result;
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while removing from cloudinary!");
    }
};

const getPublicIdFromCloudinaryUrl = (url) => {
    return url
        .split("/upload/")[1]
        .replace(/^v\d+\//, "")
        .replace(/\.[^/.]+$/, "");
};

export { uploadOnCloudinary, removeFromCloudinary, getPublicIdFromCloudinaryUrl };
