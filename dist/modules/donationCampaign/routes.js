"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const upload_1 = require("../../utils/upload");
const donationCampaign_1 = require("../../validators/donationCampaign");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
const campaignImages = upload_1.upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 8 },
]);
router.use(auth_1.requireAuth);
router.post("/", campaignImages, (0, validate_1.validate)(donationCampaign_1.upsertDonationCampaignSchema), (0, asyncHandler_1.asyncHandler)(controller_1.upsertDonationCampaign));
exports.default = router;
//# sourceMappingURL=routes.js.map