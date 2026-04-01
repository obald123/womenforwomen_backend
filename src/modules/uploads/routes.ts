import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../utils/upload";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadArticleInlineImage } from "./controller";

const router = Router();

router.use(requireAuth);

router.post(
  "/article-inline-image",
  upload.single("image"),
  asyncHandler(uploadArticleInlineImage)
);

export default router;

