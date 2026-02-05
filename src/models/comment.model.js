import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, `"content" is required.`],
            minlength: [5, `"content" must be at least 5 characters.`],
            maxlength: [200, `"content" must be at most 200 characters.`],
        },
        videoID: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: [true, `"videoID" is required.`],
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, `"userID" is required.`],
        },
    },
    {
        timestamps: true,
    }
);

export const Comment = mongoose.model("Comment", commentSchema);
