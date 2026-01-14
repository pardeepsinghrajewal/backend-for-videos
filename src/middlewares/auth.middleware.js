import config from "../config.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
    console.log("* verifyJWT *");
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Invalid access token");
        }

        const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

        if (!decodedToken._id) {
            throw new ApiError(401, "Invalid access token");
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user._id) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export default verifyJWT;
