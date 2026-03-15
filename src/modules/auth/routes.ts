import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authLimiter } from "../../middleware/rateLimiters";
import { loginSchema, refreshSchema, resetConfirmSchema, resetRequestSchema } from "../../validators/auth";
import { login, refresh, logout, requestPasswordReset, confirmPasswordReset } from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
router.post("/refresh", validate(refreshSchema), asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
router.post("/password-reset", validate(resetRequestSchema), asyncHandler(requestPasswordReset));
router.post("/password-reset/confirm", validate(resetConfirmSchema), asyncHandler(confirmPasswordReset));

export default router;