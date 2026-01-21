import mongoose, { Schema } from "mongoose";
import { getPublicIdFromCloudinaryUrl, removeFromCloudinary } from "../utils/cloudinary.js";

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

videoSchema.pre("deleteOne", { document: true, query: false }, async function () {
    if (this.video) {
        const public_id = getPublicIdFromCloudinaryUrl(this.video);
        if (public_id) {
            const result = await removeFromCloudinary(public_id, "video");
            if (result?.result !== "ok") {
                console.log(`Video ${this.video} is not found when try to remove from cloudinary!`);
            }
        }
    }
    if (this.thumbnail) {
        const public_id = getPublicIdFromCloudinaryUrl(this.thumbnail);
        if (public_id) {
            const result = await removeFromCloudinary(public_id);
            if (result?.result !== "ok") {
                console.log(`Thumbnail ${this.thumbnail} is not found when try to remove from cloudinary!`);
            }
        }
    }
});

videoSchema.methods.toggleStatus = async function () {
    this.isPublished = !this.isPublished;
    await this.save();
    return this;
};

export const Video = mongoose.model("Video", videoSchema);
