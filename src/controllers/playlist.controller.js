import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlayList = asyncHandler(async (req, res) => {
    try {
        const { name, description } = req.body ?? {};

        if (!name) {
            throw new ApiError(400, `"name" is required.`);
        }

        if (!description) {
            throw new ApiError(400, `"description" is required.`);
        }

        const playlist = await Playlist.create({
            name,
            description,
            userID: req.user._id,
        });

        return res.status(200).json(new ApiResponse(true, "Playlist is created successfully.", playlist));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }

        throw new ApiError(500, error?.message || "Error while creating the play list");
    }
});

const getPlayList = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        const playlist = await Playlist.findById(id);

        if (!playlist) {
            throw new ApiError(400, `No playlist found related to the given "id".`);
        }
        return res.status(200).json(new ApiResponse(true, "Playlist information fetched successfully.", playlist));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while geting the play list");
    }
});

const updatePlayList = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        const { name, description } = req.body ?? {};
        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }
        if (!name && !description) {
            throw new ApiError(400, `"name" or "description" is required.`);
        }

        let options = {};

        if (name) {
            options.name = name;
        }

        if (description) {
            options.description = description;
        }

        const playlist = await Playlist.findByIdAndUpdate(id, options, { new: true });
        if (!playlist) {
            throw new ApiError(400, `No playlist found related to given "id".`);
        }

        playlist.videos = [];

        return res.status(200).json(new ApiResponse(true, "Playlist updated successfully.", playlist));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }

        throw new ApiError(500, error?.message || "Error while updating the play list");
    }
});

const deletePlayList = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }
        const playlist = await Playlist.findOneAndDelete({ _id: id, userID: req.user._id });
        if (!playlist) {
            throw new ApiError(400, `No playlist found related to given "id".`);
        }
        return res.status(200).json(new ApiResponse("Playlist removed successfully."));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while deleting the play list");
    }
});

const addVideoToPlayList = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        const { videoID } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        if (!videoID) {
            throw new ApiError(400, `"videoID" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(videoID)) {
            throw new ApiError(400, `"videoID" is not valid.`);
        }

        const playlist = await Playlist.findByIdAndUpdate(
            id,
            {
                $addToSet: { videos: videoID },
            },
            {
                new: true,
                select: "-videos",
            }
        );

        if (!playlist) {
            throw new ApiError(400, `No playlist found related to given "id".`);
        }

        return res.status(200).json(new ApiResponse(true, "Video is added to the playlist", playlist));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while adding video to play list");
    }
});

const removeVideoFromPlayList = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        const { videoID } = req.body ?? {};

        if (!id) {
            throw new ApiError(400, `"id" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }

        if (!videoID) {
            throw new ApiError(400, `"videoID" is required.`);
        }
        if (!mongoose.Types.ObjectId.isValid(videoID)) {
            throw new ApiError(400, `"videoID" is not valid.`);
        }

        const playlist = await Playlist.findByIdAndUpdate(
            id,
            {
                $pull: { videos: videoID },
            },
            {
                new: true,
                select: "-videos",
            }
        );

        if (!playlist) {
            throw new ApiError(400, `No playlist found related to given "id".`);
        }

        return res.status(200).json(new ApiResponse(true, "Video is removed from the playlist", playlist));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while removing video from the play list");
    }
});

export { createPlayList, getPlayList, updatePlayList, deletePlayList, addVideoToPlayList, removeVideoFromPlayList };
