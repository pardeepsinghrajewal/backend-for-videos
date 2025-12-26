const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export { asyncHandler };

// const asyncHandler = (fn) => {
//     return async (req, res, next) => {
//         try {
//             await fn(req, res, next);
//         } catch (error) {
//             next(error);
//         }
//     };
// };
