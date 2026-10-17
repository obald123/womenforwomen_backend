"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const upload_1 = require("../../utils/upload");
const gallery_1 = require("../../validators/gallery");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", upload_1.uploadGallery.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
]), (0, validate_1.validate)(gallery_1.createGallerySchema), (0, asyncHandler_1.asyncHandler)(controller_1.createGallery));
router.get("/", (0, validate_1.validate)(gallery_1.listGallerySchema), (0, asyncHandler_1.asyncHandler)(controller_1.listGalleries));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getGallery));
router.patch("/:id", (0, validate_1.validate)(gallery_1.updateGallerySchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateGallery));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteGallery));
router.post("/:id/publish", (0, asyncHandler_1.asyncHandler)(controller_1.publishGallery));
router.post("/:id/images", upload_1.uploadGallery.array("images", 10), (0, validate_1.validate)(gallery_1.addGalleryMediaSchema), (0, asyncHandler_1.asyncHandler)(controller_1.addGalleryImages));
router.delete("/:id/images/:imageId", (0, asyncHandler_1.asyncHandler)(controller_1.deleteGalleryImage));
router.patch("/:id/images/:imageId", (0, validate_1.validate)(gallery_1.updateGalleryMediaCaptionSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateGalleryImageCaption));
router.post("/:id/videos", upload_1.uploadGallery.array("videos", 5), (0, validate_1.validate)(gallery_1.addGalleryMediaSchema), (0, asyncHandler_1.asyncHandler)(controller_1.addGalleryVideos));
router.delete("/:id/videos/:videoId", (0, asyncHandler_1.asyncHandler)(controller_1.deleteGalleryVideo));
router.patch("/:id/videos/:videoId", (0, validate_1.validate)(gallery_1.updateGalleryMediaCaptionSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateGalleryVideoCaption));
exports.default = router;
//# sourceMappingURL=routes.js.map