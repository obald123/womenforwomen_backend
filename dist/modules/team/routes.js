"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const upload_1 = require("../../utils/upload");
const team_1 = require("../../validators/team");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", upload_1.upload.single("photo"), (0, validate_1.validate)(team_1.createTeamSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createTeamMember));
router.get("/", (0, validate_1.validate)(team_1.listTeamSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listTeam));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getTeamMember));
router.patch("/:id", upload_1.upload.single("photo"), (0, validate_1.validate)(team_1.updateTeamSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateTeamMember));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteTeamMember));
router.post("/:id/publish", (0, asyncHandler_1.asyncHandler)(controller_1.publishTeamMember));
exports.default = router;
//# sourceMappingURL=routes.js.map