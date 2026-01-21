import multer from "multer";
import path from "path";
import { ApiError } from "../utils/apiError.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), "public/temp"));
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.substring(0, file.originalname.lastIndexOf("."));

        const fileExt = file.originalname.split(".").pop();

        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${fileName}-${uniqueSuffix}.${fileExt}`);
    },
});

const upload = multer({ storage });

const FILE_TYPES = {
    image: {
        mimes: ["image/jpeg", "image/png", "image/webp"],
        regex: /\.(jpg|jpeg|png|webp)$/i,
        message: "Only image files are allowed",
    },
    video: {
        mimes: ["video/mp4", "video/webm", "video/quicktime"],
        regex: /\.(mp4|webm|mov)$/i,
        message: "Only video files are allowed",
    },
};

const imageFileFilter = (req, file, cb) => {
    const typeRule = FILE_TYPES["image"];

    const isMimeValid = typeRule.mimes.includes(file.mimetype);
    const isExtValid = typeRule.regex.test(file.originalname);

    if (isMimeValid && isExtValid) {
        cb(null, true);
    } else {
        cb(new ApiError(400, `Only image files are allowed in : ${file.fieldname}`), false);
    }
};

const uploadImage = multer({
    storage,
    fileFilter: imageFileFilter,
});

const videoFileFilter = (req, file, cb) => {
    const typeRule = FILE_TYPES["video"];

    const isMimeValid = typeRule.mimes.includes(file.mimetype);
    const isExtValid = typeRule.regex.test(file.originalname);

    if (isMimeValid && isExtValid) {
        cb(null, true);
    } else {
        cb(new ApiError(400, `Only video files are allowed in : ${file.fieldname}`), false);
    }
};

const uploadVideo = multer({
    storage,
    fileFilter: videoFileFilter,
});

const uploadImagesAndVideos = ({ fields, maxFileSize = 20 * 1024 * 1024 }) => {
    const upload = multer({
        storage,
        limits: {
            fileSize: maxFileSize,
        },
        fileFilter: (req, file, cb) => {
            const fieldConfig = fields.find((f) => f.name === file.fieldname);

            if (!fieldConfig) {
                return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
            }

            const typeRule = FILE_TYPES[fieldConfig.type];

            const isMimeValid = typeRule.mimes.includes(file.mimetype);
            const isExtValid = typeRule.regex.test(file.originalname);

            if (isMimeValid && isExtValid) {
                cb(null, true);
            } else {
                cb(new ApiError(400, `Field : ${file.fieldname}, error : ${typeRule.message}`), false);
            }
        },
    });

    return upload.fields(fields.map(({ name, maxCount }) => ({ name, maxCount })));
};

export { upload, uploadImage, uploadVideo, uploadImagesAndVideos };
