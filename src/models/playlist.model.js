import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, `"name" is required.`],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [5, `"name" must be at least 5 characters.`],
            maxlength: [20, `"name" must be at most 20 characters.`],
            index: true,
        },
        description: {
            type: String,
            required: true,
            minlength: [5, `"description" must be at least 5 characters.`],
            maxlength: [200, `"description" must be at most 200 characters.`],
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
                validate: {
                    validator: function (arr) {
                        return arr.length === new Set(arr.map((v) => v.toString())).size;
                    },
                    message: "Duplicate videos are not allowed.",
                },
            },
        ],
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
