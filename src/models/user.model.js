import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config";
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [5, "Username must be at least 5 characters"],
            maxlength: [20, "Username must be at most 20 characters"],
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        avtar: {
            type: String,
            required: [true, "Avtar is required"],
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

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    return next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        config.ACCESS_TOKEN_SECRET,
        {
            expiresIn: config.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    jwt.sign(
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
