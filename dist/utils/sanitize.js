"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeContent = sanitizeContent;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function sanitizeContent(html) {
    return (0, sanitize_html_1.default)(html, {
        allowedTags: sanitize_html_1.default.defaults.allowedTags.concat([
            "img",
            "h1",
            "h2",
            "h3",
            "u",
            "s",
            "b",
            "i",
            "em",
            "strong",
            "blockquote",
        ]),
        allowedAttributes: {
            ...sanitize_html_1.default.defaults.allowedAttributes,
            img: ["src", "alt"],
            a: ["href", "name", "target", "rel"],
        },
    });
}
//# sourceMappingURL=sanitize.js.map