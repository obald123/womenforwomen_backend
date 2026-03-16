"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const newsletter_1 = require("../../validators/newsletter");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/subscribers", (0, asyncHandler_1.asyncHandler)(controller_1.listSubscribers));
router.post("/campaigns", (0, validate_1.validate)(newsletter_1.campaignSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createCampaign));
router.post("/send/:id", (0, asyncHandler_1.asyncHandler)(controller_1.sendCampaign));
router.delete("/unsubscribe/:id", (0, asyncHandler_1.asyncHandler)(controller_1.unsubscribe));
exports.default = router;
//# sourceMappingURL=routes.js.map