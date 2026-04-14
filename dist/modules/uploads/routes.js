"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const upload_1 = require("../../utils/upload");
const asyncHandler_1 = require("../../utils/asyncHandler");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/article-inline-image", upload_1.upload.single("image"), (0, asyncHandler_1.asyncHandler)(controller_1.uploadArticleInlineImage));
exports.default = router;
//# sourceMappingURL=routes.js.map