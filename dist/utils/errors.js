"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.ForbiddenError = exports.AuthError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message = "Validation error", details) {
        super(message, 400, details);
    }
}
exports.ValidationError = ValidationError;
class AuthError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}
exports.AuthError = AuthError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=errors.js.map