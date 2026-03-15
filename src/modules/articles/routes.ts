import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { upload } from "../../utils/upload";
import { createArticleSchema, listArticleSchema, updateArticleSchema } from "../../validators/articles";
import {
  createArticle,
  listArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
} from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", upload.single("coverImage"), validate(createArticleSchema), asyncHandler(createArticle));
router.get("/", validate(listArticleSchema), asyncHandler(listArticles));
router.get("/:id", asyncHandler(getArticle));
router.patch("/:id", upload.single("coverImage"), validate(updateArticleSchema), asyncHandler(updateArticle));
router.delete("/:id", asyncHandler(deleteArticle));
router.post("/:id/publish", asyncHandler(publishArticle));

export default router;