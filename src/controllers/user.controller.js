import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isEmpty, isNotValidEmail } from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getPublicIdFromCloudinaryUrl, removeFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import config from "../config.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body ?? {};

        if (isEmpty(username)) {
            throw new ApiError(400, `"username" is required.`);
        }

        if (isEmpty(email)) {
            throw new ApiError(400, `"email" is required.`);
        }

        if (isNotValidEmail(email)) {
            throw new ApiError(400, `"email" is not valid.`);
        }

        if (isEmpty(password)) {
            throw new ApiError(400, `"password" is required.`);
        }

        const avatarLocalPath = req?.files?.avatar?.[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, `"avatar" image is required.`);
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(400, "User is already exist.");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar == null || avatar == undefined) {
            throw new ApiError(500, "Server error while uploading avatar image.");
        }

        const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        const userCreated = await User.create({
            username,
            email,
            password,
            avatar: avatar.secure_url,
            fullName: fullName || "",
            coverImage: coverImage?.secure_url || "",
        });

        userCreated.password = "*****";

        return res.status(200).json(new ApiResponse(true, "User is created sucessfully", userCreated));
    } catch (error) {
        if (req?.files?.avatar?.[0]?.path && fs.existsSync(req.files.avatar[0].path)) {
            fs.unlinkSync(req.files.avatar[0].path);
        }

        if (req?.files?.coverImage?.[0]?.path && fs.existsSync(req.files.coverImage[0].path)) {
            fs.unlinkSync(req.files.coverImage[0].path);
        }

        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }

        throw new ApiError(500, error?.message || "Error while register the user!");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body ?? {};

        if (isEmpty(username)) {
            throw new ApiError(400, `"username" is required.`);
        }

        if (isEmpty(password)) {
            throw new ApiError(400, `"password" is required.`);
        }

        const user = await User.findOne({
            $or: [{ username }],
        });
        if (!user) {
            throw new ApiError(400, "User does not exist.");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(400, "Password does not match.");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        user.password = "*****";
        user.refreshToken = "*****";
        user.watchedHistory = [];

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(true, "User logged in successfully.", { user, accessToken, refreshToken }));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while login.");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $unset: {
                refreshToken: 1,
            },
        });

        return res
            .status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json(new ApiResponse(true, "User logged out successfully."));
    } catch (error) {
        throw new ApiError(500, "Error while logout.");
    }
});

const refreshToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const decodedToken = jwt.verify(incomingRefreshToken, config.REFRESH_TOKEN_SECRET);

        if (!decodedToken._id) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(true, "Token refreshed successfully.", { accessToken, refreshToken }));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body ?? {};

        if (!oldPassword) {
            throw new ApiError(400, `"oldPassword" is required.`);
        }

        if (!newPassword) {
            throw new ApiError(400, `"newPassword" is required.`);
        }

        if (!confirmPassword) {
            throw new ApiError(400, `"confirmPassword" is required.`);
        }

        if (newPassword !== confirmPassword) {
            throw new ApiError(400, `"confirmPassword" is not matched with "newPassword".`);
        }

        const user = await User.findById(req.user._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, `"oldPassword" is not correct."`);
        }

        user.password = newPassword;

        user.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(true, "Password updated successfully."));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }
        throw new ApiError(500, error?.message || "Error while changing the password.");
    }
});

const changePasswordWithoutOldPassword = asyncHandler(async (req, res) => {
    try {
        const { email, newPassword } = req.body ?? {};

        if (isEmpty(email)) {
            throw new ApiError(400, `"email" is required.`);
        }

        if (isNotValidEmail(email)) {
            throw new ApiError(400, `"email" is not valid.`);
        }

        if (!newPassword) {
            throw new ApiError(400, `"newPassword" is required.`);
        }

        const user = await User.findOne({
            email,
        });

        if (!user) {
            throw new ApiError(400, "User does not exist.");
        }
        user.password = newPassword;

        user.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(true, "Password changed successfully."));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }
        throw new ApiError(500, error?.message || "Error while changing the password.");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        user.watchedHistory = [];

        return res.status(200).json(new ApiResponse(true, "current user get successfully.", user));
    } catch (error) {
        throw new ApiError(500, "Error while getting the current user.");
    }
});

const updateAccountInfo = asyncHandler(async (req, res) => {
    try {
        const { email, fullName } = req.body ?? {};

        if (!email && !fullName) {
            throw new ApiError(400, `"email" or "fullName" is required.`);
        }

        if (!isEmpty(email) && isNotValidEmail(email)) {
            throw new ApiError(400, `"email" is not valid.`);
        }

        const updatedInfo = {};

        if (!isEmpty(email)) {
            updatedInfo.email = email;
        }

        if (!isEmpty(fullName)) {
            updatedInfo.fullName = fullName;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: updatedInfo,
            },
            {
                new: true,
            }
        );

        user.password = "*****";
        user.refreshToken = "*****";
        user.watchedHistory = [];

        return res.status(200).json(new ApiResponse(true, "User information is updated successfully!", user));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            throw new ApiError(400, messages.join(", "));
        }
        throw new ApiError(500, error?.message || "Error while updating the account info.");
    }
});

const updateAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, `"avatar" image is required.`);
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar || !avatar.secure_url) {
            throw new ApiError(500, `Error while updating the "avatar" image to cloudinary.`);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: avatar.secure_url,
                },
            },
            {
                new: true,
            }
        );

        user.password = "*****";
        user.refreshToken = "*****";
        user.watchedHistory = [];

        if (req?.user?.avatar) {
            const public_id = getPublicIdFromCloudinaryUrl(req.user.avatar);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Avatar ${req.user.avatar} is not found when try to remove old avatar from cloudinary while updating avatar!`
                    );
                }
            }
        }

        return res.status(200).json(new ApiResponse(true, "Avatar image is updated successfully.", user));
    } catch (error) {
        if (fs.existsSync(req.file?.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating the avatar image.");
    }
});

const updateCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(400, `"coverImage" is required.`);
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage || !coverImage.secure_url) {
            throw new ApiError(500, `Server error while uploading the "coverImage" image to cloudinary.`);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage: coverImage.secure_url,
                },
            },
            {
                new: true,
            }
        );

        user.password = "*****";
        user.refreshToken = "*****";
        user.watchedHistory = [];

        if (req?.user?.coverImage) {
            const public_id = getPublicIdFromCloudinaryUrl(req.user.coverImage);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Cover image ${req.user.coverImage} is not found when try to remove old cover image from cloudinary while updating cover image!`
                    );
                }
            }
        }

        return res.status(200).json(new ApiResponse(true, "Cover image updated successfully.", user));
    } catch (error) {
        if (fs.existsSync(req.file?.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Server error while updating cover image.");
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-refreshToken -password -watchedHistory");

    return res.status(200).json(new ApiResponse(true, "All Users info retrieved successfully.", users));
});

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const userID = req.user._id;

        const userAvatar = req.user?.avatar || null;

        const userCoverImage = req.user?.coverImage || null;

        const videos = await Video.find({
            owner: userID,
        });

        for (const video of videos) {
            await video.deleteOne();
        }

        const subscriptions = Subscription.find({ subscriber: userID });

        await subscriptions.deleteMany({ subscriber: userID });

        if (userAvatar) {
            const public_id = getPublicIdFromCloudinaryUrl(userAvatar);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Avatar ${userAvatar} is not found when try to remove from cloudinary while deleting the user.`
                    );
                }
            }
        }
        if (userCoverImage) {
            const public_id = getPublicIdFromCloudinaryUrl(userCoverImage);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Cover image ${userCoverImage} is not found when try to remove from cloudinary while deleting the user.`
                    );
                }
            }
        }

        await User.findByIdAndDelete(req.userID);

        return res
            .status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json(new ApiResponse(true, "User deleted and logged out successfully."));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while deleting the user.");
    }
});

const getChannelProfile = asyncHandler(async (req, res) => {
    try {
        const { username } = req.params ?? {};

        if (!username) {
            throw new ApiError(400, `"username" is required.`);
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username,
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribeTo",
                },
            },
            {
                $addFields: {
                    subscriberCount: {
                        $size: "$subscribers",
                    },
                    channelSubscribedCount: {
                        $size: "$subscribeTo",
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscriberCount: 1,
                    channelSubscribedCount: 1,
                    isSubscribed: 1,
                },
            },
        ]);

        if (!channel?.length) {
            throw new ApiError(400, "Channel not found.");
        }

        return res.status(200).json(new ApiResponse(true, "Channel profile retrieved successfully.", channel[0]));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while getting the channel profile.");
    }
});

const getWatchHistory = asyncHandler(async (req, res) => {
    try {
        const history = await User.aggregate([
            {
                $match: {
                    _id: req.user._id,
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchedHistory",
                    foreignField: "_id",
                    as: "watchedVideos",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                            avatar: 1,
                                            _id: 0,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner",
                                },
                            },
                        },
                    ],
                },
            },
        ]);

        return res
            .status(200)
            .json(new ApiResponse(true, "User watched histoty get successfully.", history[0]?.watchedVideos));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while fetching watch history.");
    }
});

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        user.password = "*****";
        user.refreshToken = "*****";
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error?.message || "Error while generating tokens!");
    }
};

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changePassword,
    getCurrentUser,
    updateAccountInfo,
    updateAvatar,
    updateCoverImage,
    getAllUsers,
    deleteUser,
    changePasswordWithoutOldPassword,
    getChannelProfile,
    getWatchHistory,
};
