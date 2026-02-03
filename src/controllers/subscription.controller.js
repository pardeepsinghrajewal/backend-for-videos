import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isPositiveInteger } from "../utils/validation.js";

const getSubscriptions = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query ?? {};

        if (!isPositiveInteger(page)) {
            throw new ApiError(400, `"page" must be a positive integer.`);
        }

        if (!isPositiveInteger(limit)) {
            throw new ApiError(400, `"limit" must be a positive integer.`);
        }

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const skip = (pageNum - 1) * limitNum;

        const sortField = "createdAt";

        const sortOrder = 1;
        const sortOptions = { [sortField]: sortOrder };

        const [subscriptions, totalSubscriptions] = await Promise.all([
            Subscription.find().sort(sortOptions).skip(skip).limit(limitNum),
            Subscription.countDocuments(),
        ]);

        const totalPages = Math.ceil(totalSubscriptions / limitNum);

        return res.status(200).json(
            new ApiResponse(true, "Subscriptions are fetched successfully.", {
                totalSubscriptions,
                totalPages,
                currentPage: pageNum,
                subscriptions,
            })
        );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting subscriptions");
    }
});

const getSubscription = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params ?? {};
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `"id" is not valid.`);
        }
        const subscription = await Subscription.findById(id);
        if (!subscription) {
            throw new ApiError(400, `No subscription found related to the given "id".`);
        }
        return res
            .status(200)
            .json(new ApiResponse(true, "Subscription information is retrieved successfully.", subscription));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting subscription information.");
    }
});

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelID } = req.params ?? {};

        const currentUserID = req.user._id;

        const currentUserName = req.user.username;

        if (!channelID) {
            throw new ApiError(400, `"channelID" is required.`);
        }

        if (!mongoose.Types.ObjectId.isValid(channelID)) {
            throw new ApiError(400, `"channelID" is not valid.`);
        }

        if (String(channelID) === String(currentUserID)) {
            throw new ApiError(400, `${currentUserName} can't subscribe to your self.`);
        }

        const user = await User.findById(channelID);

        if (!user) {
            throw new ApiError(400, `No channel found related to the given "channelID".`);
        }

        const alreadySubscribe = await Subscription.findOne({ subscriber: currentUserID, channel: channelID });

        if (alreadySubscribe) {
            await alreadySubscribe.deleteOne();
            return res
                .status(200)
                .json(new ApiResponse(true, `${currentUserName} unsubscriber to ${user.username} successfully.`));
        }
        const subscription = await Subscription.create({
            subscriber: currentUserID,
            channel: channelID,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(true, `${currentUserName} subscribed to ${user.username} successfully.`, subscription)
            );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(500, error?.message || "Error while subscribe to channel.");
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
                new ApiResponse(true, `${req.user.username} subscribed channel list is retrived sussfully.`, channels)
            );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting subscribe channel of the user.");
    }
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelID } = req.query ?? {};

        if (!channelID) {
            throw new ApiError(400, `"channelID" is required.`);
        }

        if (!mongoose.Types.ObjectId.isValid(channelID)) {
            throw new ApiError(400, `"channelID" is not valid.`);
        }

        const channel = await User.findById(channelID);

        if (!channel) {
            throw new ApiError(400, `No channel found related to the given "channelID".`);
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
            .json(new ApiResponse(true, `${channel.username} subscribers list retrieved successfully.`, subscribers));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting channel subscribers.");
    }
});

export { getSubscription, toggleSubscription, getChannelSubscribers, getSubscribedChannelsOfUser, getSubscriptions };
