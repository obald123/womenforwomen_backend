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
exports.default = router;
//# sourceMappingURL=routes.js.map