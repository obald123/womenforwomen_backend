import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { campaignSchema } from "../../validators/newsletter";
import { listSubscribers, createCampaign, sendCampaign, unsubscribe } from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/subscribers", asyncHandler(listSubscribers));
router.post("/campaigns", validate(campaignSchema), asyncHandler(createCampaign));
router.post("/send/:id", asyncHandler(sendCampaign));
router.delete("/unsubscribe/:id", asyncHandler(unsubscribe));

export default router;