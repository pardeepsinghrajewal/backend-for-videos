import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config.js";
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, `"username" is required.`],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [5, `"username" must be at least 5 characters.`],
            maxlength: [20, `"username" must be at most 20 characters.`],
            index: true,
        },
        email: {
            type: String,
            required: [true, `"email" is required.`],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, `"password" is required.`],
        },
        avatar: {
            type: String,
            required: [true, `"avatar" is required.`],
        },
        fullName: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        refreshToken: {
            type: String,
        },
        watchedHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
        },
        config.ACCESS_TOKEN_SECRET,
        {
            expiresIn: config.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        config.REFRESH_TOKEN_SECRET,
        {
            expiresIn: config.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
