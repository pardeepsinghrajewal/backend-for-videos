import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { isEmpty, isNotValidEmail } from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
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

    console.log("%c req.files ", "color: red;", req.files.avatar[0].path);
    const avatarLocalPath = req?.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required!");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(400, "user is already exist!");
    }

    const userCreated = await User.create({
        username,
        email,
        password,
        avatar: "p",
        fullName: fullName || "",
    });

    userCreated.password = "*****";

    res.status(200).json(new ApiResponse(true, "user is created sucessfully", userCreated));
});

export { registerUser };
