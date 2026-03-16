"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const logger_1 = require("../config/logger");
function errorHandler(err, req, res, _next) {
    let status = err instanceof errors_1.AppError ? err.statusCode : 500;
    let message = err instanceof errors_1.AppError ? err.message : "Internal server error";
    const isMulterError = err?.name === "MulterError";
    if (isMulterError) {
        const code = err?.code;
        if (code === "LIMIT_FILE_SIZE") {
            status = 413;
            message = "File too large (max 10MB)";
        }
        else {
            status = 400;
            message = "Invalid upload";
        }
    }
    logger_1.logger.error(message, {
        path: req.path,
        method: req.method,
        status,
        error: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
    res.status(status).json({
        success: false,
        message,
        ...(err instanceof errors_1.AppError && err.details ? { details: err.details } : {}),
    });
}
//# sourceMappingURL=errorHandler.js.map