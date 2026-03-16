"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const upload_1 = require("../../utils/upload");
const events_1 = require("../../validators/events");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", upload_1.upload.single("coverImage"), (0, validate_1.validate)(events_1.createEventSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createEvent));
router.get("/", (0, validate_1.validate)(events_1.listEventSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listEvents));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getEvent));
router.patch("/:id", upload_1.upload.single("coverImage"), (0, validate_1.validate)(events_1.updateEventSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateEvent));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteEvent));
router.post("/:id/publish", (0, asyncHandler_1.asyncHandler)(controller_1.publishEvent));
exports.default = router;
//# sourceMappingURL=routes.js.map