import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadGallery } from "../../utils/upload";
import { createGallerySchema, listGallerySchema, updateGallerySchema } from "../../validators/gallery";
import {
  createGallery,
  listGalleries,
  getGallery,
  updateGallery,
  deleteGallery,
  publishGallery,
} from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  uploadGallery.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  validate(createGallerySchema),
  asyncHandler(createGallery)
);
router.get("/", validate(listGallerySchema), asyncHandler(listGalleries));
router.get("/:id", asyncHandler(getGallery));
router.patch("/:id", validate(updateGallerySchema), asyncHandler(updateGallery));
router.delete("/:id", asyncHandler(deleteGallery));
router.post("/:id/publish", asyncHandler(publishGallery));

export default router;
