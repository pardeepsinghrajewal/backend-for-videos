import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "comment is required"],
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: [true, "Video id is required"],
        },
        user: {
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
