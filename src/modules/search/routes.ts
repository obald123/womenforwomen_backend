import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { searchSchema } from "../../validators/search";
import { searchAll } from "./controller";

const router = Router();

router.use(requireAuth);
router.get("/", validate(searchSchema), asyncHandler(searchAll));

export default router;
