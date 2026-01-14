import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isEmpty, isNotValidEmail } from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import config from "../config.js";

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

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

        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(400, "user is already exist!");
        }

        const avatarLocalPath = req?.files?.avatar[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar image is required!");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (avatar == null || avatar == undefined) {
            throw new ApiError(500, "Server error while uploading avatar image!");
        }

        const coverImageLocalPath = req?.files?.coverImage[0]?.path;
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

        res.status(200).json(new ApiResponse(true, "user is created sucessfully", userCreated));
    } catch (error) {
        if (req?.files?.avatar?.[0]?.path && fs.existsSync(req.files.avatar[0].path)) {
            fs.unlinkSync(req.files.avatar[0].path);
        }

        if (req?.files?.coverImage?.[0]?.path && fs.existsSync(req.files.coverImage[0].path)) {
            fs.unlinkSync(req.files.coverImage[0].path);
        }

        throw error;
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;

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
            throw new ApiError(400, "Password does not match!");
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
        throw new ApiError(500, error?.message || "Error in login funtion!");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1,
        },
    });

    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(true, "User logged out successfully!"));
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
        throw new ApiError(400, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { password, newPassword, confirmPassword } = req.body;

    if (!password) {
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

    if (!req?.user?._id) {
        throw new ApiError(500, "User ID not found in changePassword function!");
    }

    const user = await User.findById(req.user._id);

    user.password = newPassword;

    user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(true, "Password updated successfully!"));
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

export { registerUser, loginUser, logoutUser, refreshToken, changePassword };
