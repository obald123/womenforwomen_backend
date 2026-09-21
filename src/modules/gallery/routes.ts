import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadGallery } from "../../utils/upload";
import {
  createGallerySchema,
  listGallerySchema,
  updateGallerySchema,
  addGalleryMediaSchema,
  updateGalleryMediaCaptionSchema,
} from "../../validators/gallery";
import {
  createGallery,
  listGalleries,
  getGallery,
  updateGallery,
  deleteGallery,
  publishGallery,
  addGalleryImages,
  deleteGalleryImage,
  updateGalleryImageCaption,
  addGalleryVideos,
  deleteGalleryVideo,
  updateGalleryVideoCaption,
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

router.post(
  "/:id/images",
  uploadGallery.array("images", 10),
  validate(addGalleryMediaSchema),
  asyncHandler(addGalleryImages)
);
router.delete("/:id/images/:imageId", asyncHandler(deleteGalleryImage));
router.patch(
  "/:id/images/:imageId",
  validate(updateGalleryMediaCaptionSchema),
  asyncHandler(updateGalleryImageCaption)
);

router.post(
  "/:id/videos",
  uploadGallery.array("videos", 5),
  validate(addGalleryMediaSchema),
  asyncHandler(addGalleryVideos)
);
router.delete("/:id/videos/:videoId", asyncHandler(deleteGalleryVideo));
router.patch(
  "/:id/videos/:videoId",
  validate(updateGalleryMediaCaptionSchema),
  asyncHandler(updateGalleryVideoCaption)
);

export default router;
