"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlug = toSlug;
const slugify_1 = __importDefault(require("slugify"));
function toSlug(text) {
    return (0, slugify_1.default)(text, { lower: true, strict: true, trim: true });
}
//# sourceMappingURL=slug.js.map