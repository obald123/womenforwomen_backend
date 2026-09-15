import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadReport } from "../../utils/upload";
import {
  createImpactReportSchema,
  listImpactReportSchema,
  updateImpactReportSchema,
} from "../../validators/impactReports";
import {
  createImpactReport,
  listImpactReports,
  getImpactReport,
  updateImpactReport,
  deleteImpactReport,
  publicImpactReports,
} from "./controller";

const reportFiles = uploadReport.fields([
  { name: "file", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

const router = Router();

router.use(requireAuth);
router.post("/", reportFiles, validate(createImpactReportSchema), asyncHandler(createImpactReport));
router.get("/", validate(listImpactReportSchema), asyncHandler(listImpactReports));
router.get("/:id", asyncHandler(getImpactReport));
router.patch("/:id", reportFiles, validate(updateImpactReportSchema), asyncHandler(updateImpactReport));
router.delete("/:id", asyncHandler(deleteImpactReport));

export const publicImpactReportRouter = Router();
publicImpactReportRouter.get("/", asyncHandler(publicImpactReports));

export default router;
