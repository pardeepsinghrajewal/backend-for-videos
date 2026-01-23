import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelID } = req.body ?? {};

        const currentUserID = req?.user?._id || null;

        if (!channelID) {
            throw new ApiError(400, "channelID is required!");
        }

        if (String(channelID) === String(currentUserID)) {
            throw new ApiError(400, "User can't subscribe to your self!");
        }

        const user = await User.findById(channelID);

        if (!user) {
            throw new ApiError(400, "No channel found related to the given channel id!");
        }

        const alreadySubscribe = await Subscription.findOne({ subscriber: currentUserID, channel: channelID });

        if (alreadySubscribe) {
            await alreadySubscribe.deleteOne();
            return res.status(200).json(new ApiResponse(true, "User unsubscriber to channel successfully!"));
        }
        const subscription = await Subscription.create({
            subscriber: currentUserID,
            channel: channelID,
        });

        return res.status(200).json(new ApiResponse(true, "User subscribed to channel successfully!", subscription));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "CastError") {
            return res.status(400).json(new ApiResponse(false, "Invalid channelID format!"));
        }

        throw new ApiError(500, error?.message || "Error while subscribe to channel!");
    }
});

const getSubscribedChannelsOfUser = asyncHandler(async (req, res) => {
    try {
        const currentUserID = req?.user?._id || null;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error  while getting subscribe channel of the user");
    }
});

const getChannelSubscribers = asyncHandler(async (req, res) => {});

export { toggleSubscription, getChannelSubscribers };
