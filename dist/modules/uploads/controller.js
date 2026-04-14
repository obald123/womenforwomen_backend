"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadArticleInlineImage = uploadArticleInlineImage;
const errors_1 = require("../../utils/errors");
const imageService_1 = require("../../services/imageService");
async function uploadArticleInlineImage(req, res) {
    if (!req.file) {
        throw new errors_1.ValidationError("Missing image file");
    }
    const saved = await (0, imageService_1.saveCloudImage)(req.file, "wfw/articles/inline");
    res.status(201).json({ success: true, url: saved.url });
}
//# sourceMappingURL=controller.js.map