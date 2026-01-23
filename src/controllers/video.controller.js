import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFromCloudinary, uploadOnCloudinary, getPublicIdFromCloudinaryUrl } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import fs from "fs";

const addVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body ?? {};

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
            throw new ApiError(400, "Thumbnail is required!");
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
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Server error while adding adding video record!");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, "No video found related to given ID!");
        }

        return res.status(200).json(new ApiResponse(true, "Video information retrieved successfully!", video));
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid video ID format"));
        }

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error in getVideoById function!");
    }
});

const toggleVideoStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        const video = await Video.findById(id);
        if (!video) {
            throw new ApiError(400, "No video found related to given ID!");
        }
        await video.toggleStatus();

        return res.status(200).json(new ApiResponse(true, "Video status is toggled successfully!", video));
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid video ID format"));
        }
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error in Toggle video status function!");
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { id, title, description } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, "Video ID is required!");
        }

        if (!title && !description) {
            throw new ApiError(400, " Title or description is required!");
        }

        const updatedInfo = {};

        if (title) {
            updatedInfo.title = title;
        }

        if (description) {
            updatedInfo.description = description;
        }

        const video = await Video.findByIdAndUpdate(
            id,
            {
                $set: updatedInfo,
            },
            {
                new: true,
            }
        );

        if (!video) {
            throw new ApiError(400, "No video found related to the given ID!");
        }
        return res.status(200).json(new ApiResponse(true, "Video updated successfully!", video));
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid video ID format"));
        }

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error in update video function.");
    }
});

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.find();
        return res.status(200).json(new ApiResponse(true, "Videos are fetched successfully!", videos));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting all videos!");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!id) {
            throw new ApiError(400, "ID is required!");
        }
        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, "No record found related to the given ID!");
        }

        const isVideoDeleted = await video.deleteOne();

        return res.status(200).json(new ApiResponse(true, "Video removed successfully!"));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while deleting video!");
    }
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    try {
        const thumbnailLocalPath = req?.file?.path ?? {};

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail image is required!");
        }

        const { id } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, "Video id is required!");
        }

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, "Video not found related to the given ID");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail?.secure_url) {
            throw new ApiError(500, "Error while uploading image to cloudinary!");
        }

        if (video.thumbnail) {
            const public_id = getPublicIdFromCloudinaryUrl(video.thumbnail);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
            }
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            {
                $set: {
                    thumbnail: thumbnail.secure_url,
                },
            },
            {
                new: true,
            }
        );

        return res.status(200).json(new ApiResponse(true, "Video thumbnail is updated successfully!", updatedVideo));
    } catch (error) {
        if (req?.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid ID format!"));
        }

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating video thumbnail!");
    }
});

export { addVideo, getVideoById, toggleVideoStatus, updateVideo, getAllVideos, deleteVideo, updateVideoThumbnail };
