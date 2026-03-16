"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const upload_1 = require("../../utils/upload");
const articles_1 = require("../../validators/articles");
const controller_1 = require("./controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post("/", upload_1.upload.single("coverImage"), (0, validate_1.validate)(articles_1.createArticleSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createArticle));
router.get("/", (0, validate_1.validate)(articles_1.listArticleSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listArticles));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getArticle));
router.patch("/:id", upload_1.upload.single("coverImage"), (0, validate_1.validate)(articles_1.updateArticleSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateArticle));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteArticle));
router.post("/:id/publish", (0, asyncHandler_1.asyncHandler)(controller_1.publishArticle));
exports.default = router;
//# sourceMappingURL=routes.js.map