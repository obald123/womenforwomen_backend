"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_1 = require("../../middleware/validate");
const rateLimiters_1 = require("../../middleware/rateLimiters");
const auth_1 = require("../../validators/auth");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post("/login", rateLimiters_1.authLimiter, (0, validate_1.validate)(auth_1.loginSchema), (0, asyncHandler_1.asyncHandler)(controller_1.login));
router.post("/refresh", (0, validate_1.validate)(auth_1.refreshSchema), (0, asyncHandler_1.asyncHandler)(controller_1.refresh));
router.post("/logout", (0, asyncHandler_1.asyncHandler)(controller_1.logout));
router.post("/password-reset", (0, validate_1.validate)(auth_1.resetRequestSchema), (0, asyncHandler_1.asyncHandler)(controller_1.requestPasswordReset));
router.post("/password-reset/confirm", (0, validate_1.validate)(auth_1.resetConfirmSchema), (0, asyncHandler_1.asyncHandler)(controller_1.confirmPasswordReset));
exports.default = router;
//# sourceMappingURL=routes.js.map