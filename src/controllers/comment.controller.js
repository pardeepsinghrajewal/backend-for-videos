import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
    try {
        const { content, videoID } = req.body ?? {};
        if (!content) {
            throw new ApiError(400, "Content is required!");
        }
        if (!videoID) {
            throw new ApiError(400, "videoID is required!");
        }

        const comment = await Comment.create({ content, video: videoID, user: req.user._id });

        return res.status(200).json(new ApiResponse(true, `Comment is added successfully!`, comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while adding comment!");
    }
});

const getAllComments = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy, sortType, query } = req.body ?? {};

        const skip = (page - 1) * limit;

        const allowedSortFields = ["createdAt", "views", "duration", "title"];

        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

        const sortOrder = sortType === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        const comments = await Comment.find().sort(sortOptions).skip(skip).limit(limit);

        const totalComments = await Comment.countDocuments();

        const totalPages = Math.ceil(totalComments / limit);

        return res.status(200).json(
            new ApiResponse(true, "All comments are fetched successfully!", {
                totalComments,
                totalPages,
                currentPage: page,
                comments,
            })
        );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting all comments!");
    }
});

const updateCommnet = asyncHandler(async (req, res) => {
    try {
        const { id, content } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, "id is required!");
        }

        if (!content) {
            throw new ApiError(400, "content is required!");
        }

        const comment = await Comment.findByIdAndUpdate(
            id,
            {
                content,
            },
            { new: true }
        );

        if (!comment) {
            throw new ApiError(400, "No comment found related to given ID");
        }

        res.status(200).json(new ApiResponse(true, "Comment is updated successfully!", comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid ID format!"));
        }
        throw new ApiError(500, error?.message || "Error while updating comment!");
    }
});

const removeComment = asyncHandler(async (req, res) => {
    try {
        const { id } = req.body ?? {};
        if (!id) {
            throw new ApiError(400, "id is required!");
        }
        const comment = await Comment.findOneAndDelete({
            _id: id,
            user: req.user._id,
        });

        if (!comment) {
            throw new ApiError(400, "No comment found related to given ID");
        }

        return res.status(200).json(new ApiResponse(true, "Comment is removed successfully!", comment));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid ID format!"));
        }

        throw new ApiError(500, error?.message || "Error while removing comment!");
    }
});

export { addComment, removeComment, updateCommnet, getAllComments };
