import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadDocs } from "../../utils/upload";
import { applyGeneralSchema, applyJobSchema, createJobSchema, listJobSchema, updateApplicationSchema, updateGeneralApplicationSchema, updateJobSchema } from "../../validators/jobs";
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  listApplications,
  updateApplication,
  applyToJob,
  publicJobs,
  publicJob,
  listGeneralApplications,
  updateGeneralApplication,
  applyGeneral,
  downloadJobFile,
  downloadGeneralFile,
} from "./controller";

const router = Router();

router.use(requireAuth);
router.post("/", validate(createJobSchema), asyncHandler(createJob));
router.get("/", validate(listJobSchema), asyncHandler(listJobs));
router.get("/:id", asyncHandler(getJob));
router.patch("/:id", validate(updateJobSchema), asyncHandler(updateJob));
router.delete("/:id", asyncHandler(deleteJob));
router.get("/:id/applications", asyncHandler(listApplications));
router.patch("/applications/:id", validate(updateApplicationSchema), asyncHandler(updateApplication));
router.get("/applications/:id/download/:type", asyncHandler(downloadJobFile));
router.get("/general/applications", asyncHandler(listGeneralApplications));
router.patch("/general/applications/:id", validate(updateGeneralApplicationSchema), asyncHandler(updateGeneralApplication));
router.get("/general/applications/:id/download/:type", asyncHandler(downloadGeneralFile));

export const publicJobRouter = Router();
publicJobRouter.get("/", asyncHandler(publicJobs));
publicJobRouter.get("/:slug", asyncHandler(publicJob));
publicJobRouter.post(
  "/general/apply",
  uploadDocs.fields([
    { name: "resume", maxCount: 1 },
    { name: "supporting", maxCount: 1 },
  ]),
  validate(applyGeneralSchema),
  asyncHandler(applyGeneral)
);
publicJobRouter.post(
  "/:id/apply",
  uploadDocs.fields([
    { name: "resume", maxCount: 1 },
    { name: "supporting", maxCount: 1 },
  ]),
  validate(applyJobSchema),
  asyncHandler(applyToJob)
);

export default router;
