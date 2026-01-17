import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
    {
        video: {
            type: String,
            required: [true, "Video src is required"],
        },
        thumbnail: {
            type: String,
            required: [true, "Video thumbnail is required"],
        },
        title: {
            type: String,
            required: [true, "Video title is required"],
        },
        description: {
            type: String,
            required: [true, "Video description is required"],
        },
        duration: {
            type: String,
            required: [true, "Video duration is required"],
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Video = mongoose.model("Video", videoSchema);
