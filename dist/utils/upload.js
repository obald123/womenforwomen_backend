"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocs = exports.uploadGallery = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("./errors");
// Allow larger uploads so we can compress before sending to Cloudinary.
// Keep images lower, but allow larger videos for gallery uploads.
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_GALLERY_FILE_SIZE = 200 * 1024 * 1024;
const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const videoAllowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"];
const docAllowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (!allowed.includes(file.mimetype)) {
            return cb(new errors_1.ValidationError("Invalid file type"));
        }
        cb(null, true);
    },
});
exports.uploadGallery = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_GALLERY_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (![...allowed, ...videoAllowed].includes(file.mimetype)) {
            return cb(new errors_1.ValidationError("Invalid file type"));
        }
        cb(null, true);
    },
});
exports.uploadDocs = (0, multer_1.default)({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (!docAllowed.includes(file.mimetype)) {
            return cb(new errors_1.ValidationError("Invalid document type"));
        }
        cb(null, true);
    },
});
//# sourceMappingURL=upload.js.map