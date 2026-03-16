"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicMessageRouter = void 0;
const express_1 = require("express");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const messages_1 = require("../../validators/messages");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", (0, validate_1.validate)(messages_1.listMessageSchema), (0, asyncHandler_1.asyncHandler)(controller_1.listMessages));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.getMessage));
router.patch("/:id", (0, validate_1.validate)(messages_1.updateMessageSchema), (0, asyncHandler_1.asyncHandler)(controller_1.updateMessage));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(controller_1.deleteMessage));
exports.publicMessageRouter = (0, express_1.Router)();
exports.publicMessageRouter.post("/", (0, validate_1.validate)(messages_1.createMessageSchema), (0, asyncHandler_1.asyncHandler)(controller_1.createMessage));
exports.default = router;
//# sourceMappingURL=routes.js.map