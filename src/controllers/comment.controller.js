import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isPositiveInteger } from "../utils/validation.js";

const addComment = asyncHandler(async (req, res) => {
    try {
        const { content, videoID } = req.body ?? {};
        if (!content) {
            throw new ApiError(400, `"content" is required.`);
        }
        if (!videoID) {
            throw new ApiError(400, `"videoID" is required.`);
        }

        if (videoID && !mongoose.Types.ObjectId.isValid(videoID)) {
            throw new ApiError(400, `"videoID" is not valid.`);
        }

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError(400, `No record found related to given "videoID".`);
        }

        const comment = await Comment.create({ content, videoID, userID: req.user._id });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    true,
                    `Comment is added to '${video.title}' successfully by user ${req.user?.username}.`,
                    comment
                )
            );

        return res.status(200).json(new ApiResponse(true, `Comment is added successfully.`, comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while adding comment.");
    }
});

const getComments = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, sortType, videoID, userID } = req.query ?? {};

        if (!isPositiveInteger(page)) {
            throw new ApiError(400, `"page" must be a positive integer.`);
        }

        if (!isPositiveInteger(limit)) {
            throw new ApiError(400, `"limit" must be a positive integer.`);
        }

        if (sortType && !(sortType === "ASC" || sortType === "DESC")) {
            throw new ApiError(400, `"sortType" must be a 'ASC' or 'DESC'.`);
        }

        if (videoID && !mongoose.Types.ObjectId.isValid(videoID)) {
            throw new ApiError(400, `"videoID" is not valid.`);
        }

        if (userID && !mongoose.Types.ObjectId.isValid(userID)) {
            throw new ApiError(400, `"userID" is not valid.`);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const skip = (pageNum - 1) * limitNum;

        const sortField = "createdAt";

        const sortOrder = sortType === "ASC" ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        let options = {};

        if (videoID) {
            options.videoID = videoID;
        }

        if (userID) {
            options.userID = userID;
        }

        const [comments, totalComments] = await Promise.all([
            Comment.find(options).sort(sortOptions).skip(skip).limit(limitNum),
            Comment.countDocuments(options),
        ]);

        const totalPages = Math.ceil(totalComments / limitNum);

        return res.status(200).json(
            new ApiResponse(true, "Comments are fetched successfully.", {
                totalComments,
                totalPages,
                currentPage: pageNum,
                comments,
            })
        );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error while getting comments.");
    }
});

const updateCommnet = asyncHandler(async (req, res) => {
    try {
        const { id, content } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }

        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        if (!content) {
            throw new ApiError(400, `"content" is required.`);
        }

        const comment = await Comment.findByIdAndUpdate(
            id,
            {
                content,
            },
            { new: true }
        );

        if (!comment) {
            throw new ApiError(400, `No comment found related to the given "ID"`);
        }

        res.status(200).json(new ApiResponse(true, "Comment is updated successfully.", comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating comment.");
    }
});

const removeComment = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!id) {
            throw new ApiError(400, `"id" is required!`);
        }

        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        const comment = await Comment.findOneAndDelete({
            _id: id,
            userID: req.user._id,
        });

        if (!comment) {
            throw new ApiError(400, `No comment found related to given "ID"`);
        }

        return res.status(200).json(new ApiResponse(true, "Comment is removed successfully.", comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while removing comment!");
    }
});

export { addComment, removeComment, updateCommnet, getComments };
