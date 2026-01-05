import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    console.log("%c Test-1 ", "color: red;");
    res.status(200).json({
        message: "ok",
    });
});

export { registerUser };
