import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { upload } from "../../utils/upload";
import { createEventSchema, listEventSchema, updateEventSchema } from "../../validators/events";
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
} from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", upload.single("coverImage"), validate(createEventSchema), asyncHandler(createEvent));
router.get("/", validate(listEventSchema), asyncHandler(listEvents));
router.get("/:id", asyncHandler(getEvent));
router.patch("/:id", upload.single("coverImage"), validate(updateEventSchema), asyncHandler(updateEvent));
router.delete("/:id", asyncHandler(deleteEvent));
router.post("/:id/publish", asyncHandler(publishEvent));

export default router;