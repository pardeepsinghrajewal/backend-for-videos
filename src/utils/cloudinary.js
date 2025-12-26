import { v2 as cloudinary } from "cloudinary";
import config from "../config";

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (localPath) => {
    try {
        if (!localPath) return null;

        const uploadResult = await cloudinary.uploader.upload(localPath, { resource_type: "auto" }).catch((error) => {
            console.log("CloudinaryUpload has error: ", error);
        });
        console.log(uploadResult);
        fs.unlinkSync(localPath);
        return uploadResult;
    } catch (error) {
        console.log("Error in cloudinaryUpload : ", error);
        fs.unlinkSync(localPath);
        return null;
    }
};

export { cloudinaryUpload };
