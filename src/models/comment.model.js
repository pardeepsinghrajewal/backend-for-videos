import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "comment is required"],
        },
        videoID: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: [true, "Video id is required"],
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User id is required"],
        },
    },
    {
        timestamps: true,
    }
);

export const Comment = mongoose.model("Comment", commentSchema);
