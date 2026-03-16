"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCloudImage = saveCloudImage;
exports.saveCloudFile = saveCloudFile;
const cloudinary_1 = require("cloudinary");
const sharp_1 = __importDefault(require("sharp"));
const env_1 = require("../config/env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
async function saveCloudImage(file, folder) {
    const processed = await (0, sharp_1.default)(file.buffer)
        .rotate()
        .resize({ width: 2000, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    if (processed.length > 10 * 1024 * 1024) {
        throw new Error("Compressed image is still above 10MB. Please upload a smaller image.");
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        }, (error, result) => {
            if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed"));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(processed);
    });
}
async function saveCloudFile(file, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "raw",
        }, (error, result) => {
            if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed"));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(file.buffer);
    });
}
//# sourceMappingURL=imageService.js.map