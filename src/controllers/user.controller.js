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

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body ?? {};

        if (isEmpty(username)) {
            throw new ApiError(400, "Username is required!");
        }

        if (isEmpty(email)) {
            throw new ApiError(400, "Email is required!");
        }

        if (isNotValidEmail(email)) {
            throw new ApiError(400, "Email is not valid!");
        }

        if (isEmpty(password)) {
            throw new ApiError(400, "Password is required!");
        }

        const avatarLocalPath = req?.files?.avatar?.[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required!");
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(400, "User is already exist!");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar == null || avatar == undefined) {
            throw new ApiError(500, "Server error while uploading avatar image!");
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

        res.status(200).json(new ApiResponse(true, "User is created sucessfully", userCreated));
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

        throw new ApiError(500, error?.message || "Error while register the user!");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body ?? {};

        if (isEmpty(username)) {
            throw new ApiError(400, "Username is required!");
        }

        if (isEmpty(password)) {
            throw new ApiError(400, "Password is required!");
        }

        const user = await User.findOne({
            $or: [{ username }],
        });
        if (!user) {
            throw new ApiError(400, "User does not exist!");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Password does not match!");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        user.password = "*****";
        user.refreshToken = "*****";

        res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(true, "User logged in successfully!", { user, accessToken, refreshToken }));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while login!");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $unset: {
                refreshToken: 1,
            },
        });

        res.status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json(new ApiResponse(true, "User logged out successfully!"));
    } catch (error) {
        throw new ApiError(500, "Error while logout!");
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

        if (!user._id || !user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(true, "Token refreshed successfully!", { accessToken, refreshToken }));
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
            throw new ApiError(400, "Password is required!");
        }

        if (!newPassword) {
            throw new ApiError(400, "New Password is required!");
        }

        if (!confirmPassword) {
            throw new ApiError(400, "Confirm Password is required!");
        }

        if (newPassword !== confirmPassword) {
            throw new ApiError(400, "Confirm Password is not matched!");
        }

        const user = await User.findById(req.user._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Old password is not correct!");
        }

        user.password = newPassword;

        user.save({ validateBeforeSave: false });

        res.status(200).json(new ApiResponse(true, "Password updated successfully!"));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while changing the password!");
    }
});

const changePasswordWithoutOldPassword = asyncHandler(async (req, res) => {
    try {
        const { email, newPassword } = req.body ?? {};

        if (isEmpty(email)) {
            throw new ApiError(400, "Email is required!");
        }

        if (isNotValidEmail(email)) {
            throw new ApiError(400, "Email is not valid!");
        }

        if (!newPassword) {
            throw new ApiError(400, "New Password is required!");
        }

        const user = await User.findOne({
            email,
        });

        user.password = newPassword;

        user.save({ validateBeforeSave: false });

        res.status(200).json(new ApiResponse(true, "Password changed successfully!"));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while changing the password!");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        res.status(200).json(new ApiResponse(true, "current user get successfully", req.user));
    } catch (error) {
        throw new ApiError(500, "Error while getting the current user!");
    }
});

const updateAccountInfo = asyncHandler(async (req, res) => {
    try {
        const { email, fullName } = req.body ?? {};

        if (!email && !fullName) {
            throw new ApiError(400, "All fields are empty!");
        }

        if (!isEmpty(email) && isNotValidEmail(email)) {
            throw new ApiError(400, "Email is not valid!");
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

        res.status(200).json(new ApiResponse(true, "Information is updated successfully!", user));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating the account info!");
    }
});

const updateAvatar = asyncHandler(async (req, res) => {
    try {
        const user2 = req.user;

        const avatarLocalPath = req.file?.path;

        console.log("* user2 *", user2);

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required!");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar || !avatar.secure_url) {
            throw new ApiError(500, "Error while updating the avatar image to cloudinary!");
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

        res.status(200).json(new ApiResponse(true, "Avatar image is updated successfully!", user));
    } catch (error) {
        if (fs.existsSync(req.file?.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while updating the avatar image!");
    }
});

const updateCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover image is required!");
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage || !coverImage.secure_url) {
            throw new ApiError(500, "Server error while uploading cover image to cloudinary");
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

        res.status(200).json(new ApiResponse(true, "Cover image updated successfully!", user));
    } catch (error) {
        if (fs.existsSync(req.file?.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Server error while updating cover image");
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).json(new ApiResponse(true, "All Users info retrieved successfully!", users));
});

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const videos = await Video.find({
            owner: user._id,
        });
        for (const video of videos) {
            await video.deleteOne();
        }

        if (user.avatar) {
            const public_id = getPublicIdFromCloudinaryUrl(user.avatar);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Avatar ${user.avatar} is not found when try to remove from cloudinary while deleting the user!`
                    );
                }
            }
        }
        if (user.coverImage) {
            const public_id = getPublicIdFromCloudinaryUrl(user.coverImage);
            if (public_id) {
                const result = await removeFromCloudinary(public_id);
                if (result?.result !== "ok") {
                    console.log(
                        `Cover image ${user.coverImage} is not found when try to remove from cloudinary while deleting the user!`
                    );
                }
            }
        }

        await User.findByIdAndDelete(req.user._id);

        res.status(200)
            .clearCookie("accessToken", cookieOptions)
            .clearCookie("refreshToken", cookieOptions)
            .json(new ApiResponse(true, "User deleted and logged out successfully!"));

        //res.status(200).json(new ApiResponse(true, "videos are found and removed!", videos));
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Error while deleting the user!");
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
};
