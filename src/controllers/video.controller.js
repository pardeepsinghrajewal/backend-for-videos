import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFromCloudinary, uploadOnCloudinary, getPublicIdFromCloudinaryUrl } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import fs from "fs";
import { User } from "../models/user.model.js";
import { isPositiveInteger } from "../utils/validation.js";
import mongoose from "mongoose";

const addVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body ?? {};

        if (!title) {
            throw new ApiError(400, `"Title" is required.`);
        }

        if (!description) {
            throw new ApiError(400, `"Description" is required.`);
        }

        const videoLocalPath = req?.files?.video?.[0]?.path;

        if (!videoLocalPath) {
            throw new ApiError(400, `"video" is required.`);
        }

        const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(400, `"thumbnail" is required.`);
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
            userID: req.user._id,
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

        throw new ApiError(500, error?.message || "Error while adding the video record.");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, `No video found related to the given "id".`);
        }

        return res.status(200).json(new ApiResponse(true, "Video information retrieved successfully!", video));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error in while getting the video by id.");
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { id, title, description } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        if (!title && !description) {
            throw new ApiError(400, `"title" or "description" is required.`);
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
            throw new ApiError(400, `No video found related to the given "id"`);
        }
        return res.status(200).json(new ApiResponse(true, "Video updated successfully!", video));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating the video information.");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }
        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, `No record found related to the given "id".`);
        }

        await video.deleteOne();

        return res.status(200).json(new ApiResponse(true, "Video is removed successfully."));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while deleting the video.");
    }
});

const getVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy, sortType, userID } = req.query ?? {};

        if (!isPositiveInteger(page)) {
            throw new ApiError(400, `"page" must be a positive integer.`);
        }

        if (!isPositiveInteger(limit)) {
            throw new ApiError(400, `"limit" must be a positive integer.`);
        }

        if (sortType && !(sortType === "ASC" || sortType === "DESC")) {
            throw new ApiError(400, `"sortType" must be a 'ASC' or 'DESC'.`);
        }

        if (sortBy && !["createdAt", "views", "duration", "title"].includes(sortBy)) {
            throw new ApiError(400, `"sortBy" must be a 'createdAt' or 'views' or 'duration' or 'title'.`);
        }

        if (userID && !mongoose.Types.ObjectId.isValid(userID)) {
            throw new ApiError(400, `"userID" is not valid.`);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const skip = (pageNum - 1) * limitNum;

        const allowedSortFields = ["createdAt", "views", "duration", "title"];

        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

        const sortOrder = sortType === "ASC" ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        let options = {};

        if (userID) {
            options.userID = userID;
        }

        const [videos, totalVideos] = await Promise.all([
            Video.find(options).sort(sortOptions).skip(skip).limit(limitNum),
            Video.countDocuments(options),
        ]);

        const totalPages = Math.ceil(totalVideos / limitNum);

        return res.status(200).json(
            new ApiResponse(true, "Videos are fetched successfully!", {
                totalVideos,
                totalPages,
                currentPage: page,
                videos,
            })
        );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error while getting all videos!");
    }
});

const toggleVideoStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }
        const video = await Video.findById(id);
        if (!video) {
            throw new ApiError(400, `No video found related to the given "id".`);
        }
        await video.toggleStatus();

        return res.status(200).json(new ApiResponse(true, `Video status is toggled successfully.`, video));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error in Toggle video status function!");
    }
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    try {
        const thumbnailLocalPath = req?.file?.path ?? {};

        if (!thumbnailLocalPath) {
            throw new ApiError(400, `"thumbnail" is required!"`);
        }

        const { id } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(400, `Video not found related to the given "id".`);
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

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating video thumbnail!");
    }
});

const watchVideo = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        const video = await Video.findByIdAndUpdate(
            id,
            {
                $inc: {
                    views: 1,
                },
            },
            { new: true }
        );

        if (!video) {
            throw new ApiError(400, `No video found related to given "id"`);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: { watchedHistory: id },
            },
            {
                new: true,
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    true,
                    `${video.title} id is added into history of ${user.username} successfully and video count updated to ${video.views} !`
                )
            );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error in video watch function!");
    }
});

export {
    addVideo,
    getVideoById,
    toggleVideoStatus,
    updateVideo,
    getVideos,
    deleteVideo,
    updateVideoThumbnail,
    watchVideo,
};
