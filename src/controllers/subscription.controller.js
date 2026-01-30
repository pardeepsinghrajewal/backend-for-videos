import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelID } = req.body ?? {};

        const currentUserID = req?.user?._id || null;

        const currentUserName = req?.user?.username || null;

        if (!channelID) {
            throw new ApiError(400, "channelID is required!");
        }

        if (String(channelID) === String(currentUserID)) {
            throw new ApiError(400, `${currentUserName} can't subscribe to your self!`);
        }

        const user = await User.findById(channelID);

        if (!user) {
            throw new ApiError(400, "No channel found related to the given channel id!");
        }

        const alreadySubscribe = await Subscription.findOne({ subscriber: currentUserID, channel: channelID });

        if (alreadySubscribe) {
            await alreadySubscribe.deleteOne();
            return res
                .status(200)
                .json(new ApiResponse(true, `${currentUserName} unsubscriber to ${user.username} successfully!`));
        }
        const subscription = await Subscription.create({
            subscriber: currentUserID,
            channel: channelID,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(true, `${currentUserName} subscribed to ${user.username} successfully!`, subscription)
            );
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
        const channels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: req.user._id,
                },
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "channel",
                    as: "channel",
                },
            },
            {
                $unwind: "$channel", //  converts array to object
            },
            {
                $project: {
                    _id: 0,
                    id: "$channel._id",
                    name: "$channel.username",
                    avatar: "$channel.avatar",
                    subscribedAt: "$createdAt",
                },
            },
        ]);
        return res
            .status(200)
            .json(
                new ApiResponse(true, `${req.user.username} subscribed channel list is retrived sussfully!`, channels)
            );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting subscribe channel of the user!");
    }
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelID } = req.body ?? {};

        if (!channelID) {
            throw new ApiError(400, "channelID is required!");
        }

        const channel = await User.findById(channelID);

        if (!channel) {
            throw new ApiError(400, "No channel found related to the given id!");
        }

        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelID),
                },
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "subscriber",
                    as: "subscriber",
                },
            },
            {
                $unwind: "$subscriber",
            },
            {
                $project: {
                    _id: 0,
                    name: "$subscriber.username",
                    email: "$subscriber.email",
                },
            },
        ]);

        return res
            .status(200)
            .json(new ApiResponse(true, `${channel.username} subscribers list retrieved successfully!`, subscribers));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting channel subscribers!");
    }
});

export { toggleSubscription, getChannelSubscribers, getSubscribedChannelsOfUser };
