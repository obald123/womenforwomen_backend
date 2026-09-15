"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicImpactReportRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const upload_1 = require("../../utils/upload");
const impactReports_1 = require("../../validators/impactReports");
const controller_1 = require("./controller");
const reportFiles = upload_1.uploadReport.fields([
    { name: "file", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
]);
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", reportFiles, (0, validate_1.validate)(impactReports_1.createImpactReportSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createImpactReport));
router.get("/", (0, validate_1.validate)(impactReports_1.listImpactReportSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listImpactReports));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getImpactReport));
router.patch("/:id", reportFiles, (0, validate_1.validate)(impactReports_1.updateImpactReportSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateImpactReport));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteImpactReport));
exports.publicImpactReportRouter = (0, express_1.Router)();
exports.publicImpactReportRouter.get("/", (0, asyncHandler_1.asyncHandler)(controller_1.publicImpactReports));
exports.publicImpactReportRouter.get("/:id/download", (0, asyncHandler_1.asyncHandler)(controller_1.downloadImpactReport));
exports.default = router;
//# sourceMappingURL=routes.js.map