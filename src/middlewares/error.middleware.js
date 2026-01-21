import config from "../config.js";
import multer from "multer";
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong";

    if (err instanceof multer.MulterError && 1 == 1) {
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                message = "File size limit exceeded";
                statusCode = 400;
                break;

            case "LIMIT_FILE_COUNT":
                message = "Too many files uploaded";
                statusCode = 400;
                break;

            case "LIMIT_UNEXPECTED_FILE":
                message = err.field ? `Unexpected file field : ${err.field}` : "Unexpected file field";
                statusCode = 400;
                break;

            case "LIMIT_FIELD_KEY":
            case "LIMIT_FIELD_VALUE":
                message = "Form field too large";
                statusCode = 400;
                break;
        }
    }

    const response = {
        success: false,
        message,
    };

    if (config.NODE_ENV == "development") {
        response.stack = err?.stack;
    }
    res.status(statusCode).json(response);
};

export { errorHandler };
