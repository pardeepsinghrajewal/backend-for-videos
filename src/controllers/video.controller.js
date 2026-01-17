import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const addVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            throw new ApiError(400, "Title is required!");
        }

        if (!description) {
            throw new ApiError(400, "Description is required!");
        }

        const videoLocalPath = req?.files?.video?.[0]?.path;

        if (!videoLocalPath) {
            throw new ApiError(400, "Video is required!");
        }

        const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thhumbnail is required!");
        }

        const video = await uploadOnCloudinary(videoLocalPath);

        if (!video?.secure_url) {
            throw new ApiError(500, "Error while uploading the video to cloudinary!");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail?.secure_url) {
            throw new ApiError(500, "Error while uploading the thumbnail to cloudinary!");
        }

        const videoObj = await Video.create({
            video: video.secure_url,
            thumbnail: thumbnail.secure_url,
            title,
            description,
            duration: video.duration,
            owner: req.user._id,
        });

        res.status(200).json(new ApiResponse(true, "Video uploaded sucessfully!", videoObj));
    } catch (error) {
        if (req?.files?.video?.[0]?.path && fs.existsSync(req.files.video[0].path)) {
            fs.unlinkSync(req.files.video[0].path);
        }

        if (req?.files?.thumbnail?.[0]?.path && fs.existsSync(req.files.thumbnail[0].path)) {
            fs.unlinkSync(req.files.thumbnail[0].path);
        }
        throw new ApiError(500, error?.message || "Server error while adding adding video record!");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    try {
        console.log("* req.params *", req.params);
        const { id } = req.params;
        const video = await Video.findById(id);

        res.status(200).json(new ApiResponse(true, "Video information retrieved successfully!", video));
    } catch (error) {
        throw new ApiError(500, error?.message || "Error in getVideoById function!");
    }
});

const toggleVideoStatus = asyncHandler(async (req, res) => {
    // 696b834909a427c9b81e9b32

    try {
        const { id } = req.body;
    } catch (error) {
        throw new ApiError(500, error?.message || "Error in Toggle video status function!");
    }
});

export { addVideo, getVideoById };
