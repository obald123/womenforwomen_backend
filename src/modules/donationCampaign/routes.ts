import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { upload } from "../../utils/upload";
import { upsertDonationCampaignSchema } from "../../validators/donationCampaign";
import { upsertDonationCampaign } from "./controller";

const router = Router();
const campaignImages = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 8 },
]);

router.use(requireAuth);
router.post(
  "/",
  campaignImages,
  validate(upsertDonationCampaignSchema),
  asyncHandler(upsertDonationCampaign),
);

export default router;
