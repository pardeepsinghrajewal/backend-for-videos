import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isEmpty, isNotValidEmail } from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

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

        const options = {
            httpOnly: true,
            secure: true,
        };

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(true, "User logged in successfully!", { user, accessToken, refreshToken }));
    } catch (error) {
        throw error;
    }
});

export { registerUser, loginUser };
