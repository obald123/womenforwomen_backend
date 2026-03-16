"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const asyncHandler_1 = require("../../utils/asyncHandler");
const search_1 = require("../../validators/search");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", (0, validate_1.validate)(search_1.searchSchema), (0, asyncHandler_1.asyncHandler)(controller_1.searchAll));
exports.default = router;
//# sourceMappingURL=routes.js.map