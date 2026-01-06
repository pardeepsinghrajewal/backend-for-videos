import config from "../config.js";
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        message: err.message || "Something went wrong",
    };

    if (config.NODE_ENV == "development") {
        response.stack = err?.stack;
    }
    res.status(statusCode).json(response);
};

export { errorHandler };
