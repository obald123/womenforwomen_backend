"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicJobRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const upload_1 = require("../../utils/upload");
const jobs_1 = require("../../validators/jobs");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", (0, validate_1.validate)(jobs_1.createJobSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createJob));
router.get("/", (0, validate_1.validate)(jobs_1.listJobSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listJobs));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getJob));
router.patch("/:id", (0, validate_1.validate)(jobs_1.updateJobSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateJob));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteJob));
router.get("/:id/applications", (0, asyncHandler_1.asyncHandler)(controller_1.listApplications));
router.patch("/applications/:id", (0, validate_1.validate)(jobs_1.updateApplicationSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateApplication));
router.get("/applications/:id/download/:type", (0, asyncHandler_1.asyncHandler)(controller_1.downloadJobFile));
router.get("/general/applications", (0, asyncHandler_1.asyncHandler)(controller_1.listGeneralApplications));
router.patch("/general/applications/:id", (0, validate_1.validate)(jobs_1.updateGeneralApplicationSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateGeneralApplication));
router.get("/general/applications/:id/download/:type", (0, asyncHandler_1.asyncHandler)(controller_1.downloadGeneralFile));
exports.publicJobRouter = (0, express_1.Router)();
exports.publicJobRouter.get("/", (0, asyncHandler_1.asyncHandler)(controller_1.publicJobs));
exports.publicJobRouter.get("/:slug", (0, asyncHandler_1.asyncHandler)(controller_1.publicJob));
exports.publicJobRouter.post("/general/apply", upload_1.uploadDocs.fields([
    { name: "resume", maxCount: 1 },
    { name: "supporting", maxCount: 1 },
]), (0, validate_1.validate)(jobs_1.applyGeneralSchema), (0, asyncHandler_1.asyncHandler)(controller_1.applyGeneral));
exports.publicJobRouter.post("/:id/apply", upload_1.uploadDocs.fields([
    { name: "resume", maxCount: 1 },
    { name: "supporting", maxCount: 1 },
]), (0, validate_1.validate)(jobs_1.applyJobSchema), (0, asyncHandler_1.asyncHandler)(controller_1.applyToJob));
exports.default = router;
//# sourceMappingURL=routes.js.map