import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { upload } from "../../utils/upload";
import { createTeamSchema, listTeamSchema, updateTeamSchema } from "../../validators/team";
import {
  createTeamMember,
  listTeam,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember,
  publishTeamMember,
} from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", upload.single("photo"), validate(createTeamSchema), asyncHandler(createTeamMember));
router.get("/", validate(listTeamSchema), asyncHandler(listTeam));
router.get("/:id", asyncHandler(getTeamMember));
router.patch("/:id", upload.single("photo"), validate(updateTeamSchema), asyncHandler(updateTeamMember));
router.delete("/:id", asyncHandler(deleteTeamMember));
router.post("/:id/publish", asyncHandler(publishTeamMember));

export default router;