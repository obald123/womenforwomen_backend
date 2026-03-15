import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { createMessageSchema, listMessageSchema, updateMessageSchema } from "../../validators/messages";
import { createMessage, deleteMessage, getMessage, listMessages, updateMessage } from "./controller";

const router = Router();

router.use(requireAuth);
router.get("/", validate(listMessageSchema), asyncHandler(listMessages));
router.get("/:id", asyncHandler(getMessage));
router.patch("/:id", validate(updateMessageSchema), asyncHandler(updateMessage));
router.delete("/:id", asyncHandler(deleteMessage));

export const publicMessageRouter = Router();
publicMessageRouter.post("/", validate(createMessageSchema), asyncHandler(createMessage));

export default router;
