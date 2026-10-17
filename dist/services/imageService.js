"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCloudImage = saveCloudImage;
exports.deleteCloudAsset = deleteCloudAsset;
exports.saveCloudFile = saveCloudFile;
exports.saveCloudVideo = saveCloudVideo;
const cloudinary_1 = require("cloudinary");
const sharp_1 = __importDefault(require("sharp"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
async function saveCloudImage(file, folder) {
    let processed;
    try {
        processed = await (0, sharp_1.default)(file.buffer)
            .rotate()
            .resize({ width: 2000, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();
    }
    catch {
        throw new errors_1.ValidationError("That image file is invalid or corrupted. Please upload a different image.");
    }
    if (processed.length > 10 * 1024 * 1024) {
        throw new errors_1.ValidationError("Compressed image is still above 10MB. Please upload a smaller image.");
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
        }, (error, result) => {
            if (error || !result) {
                reject(toUploadError(error));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(processed);
    });
}
async function deleteCloudAsset(publicId, resourceType) {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
    }
    catch (err) {
        // Best-effort: an orphaned Cloudinary asset is preferable to blocking the
        // admin from removing the item from the gallery.
        console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
    }
}
async function saveCloudFile(file, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "raw",
        }, (error, result) => {
            if (error || !result) {
                reject(toUploadError(error));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(file.buffer);
    });
}
// Cloudinary rejects oversized uploads (e.g. raw files over this account's plan limit)
// with its own "File size too large" error, and separately aborts the request client-side
// after 60s with a "Request Timeout" error if its API is slow to respond — both otherwise
// surface as an opaque 500.
function toUploadError(error) {
    const message = error?.message;
    const name = error?.name;
    if (message && /file size too large/i.test(message)) {
        return new errors_1.ValidationError("This file is too large for our file host. Please upload a smaller file.");
    }
    if (name === "TimeoutError" || (message && /request timeout/i.test(message))) {
        return new errors_1.AppError("The file host took too long to respond. Please try again.", 504);
    }
    return error ?? new Error("Cloudinary upload failed");
}
async function saveCloudVideo(file, folder) {
    const compressed = await compressVideoBuffer(file.buffer);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "video",
        }, (error, result) => {
            if (error || !result) {
                reject(toUploadError(error));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(compressed);
    });
}
async function compressVideoBuffer(buffer) {
    if (!ffmpeg_static_1.default) {
        throw new Error("FFmpeg is not available for video compression");
    }
    const tmpDir = os_1.default.tmpdir();
    const id = crypto_1.default.randomUUID();
    const inputPath = path_1.default.join(tmpDir, `wfw-video-input-${id}.mp4`);
    const outputPath = path_1.default.join(tmpDir, `wfw-video-output-${id}.mp4`);
    await promises_1.default.writeFile(inputPath, buffer);
    await new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            "-movflags +faststart",
            "-preset veryfast",
            "-crf 28",
            "-c:v libx264",
            "-c:a aac",
            "-b:a 128k",
        ])
            .videoFilters("scale='min(1280,iw)':-2")
            .format("mp4")
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .save(outputPath);
    });
    const output = await promises_1.default.readFile(outputPath);
    await Promise.allSettled([promises_1.default.unlink(inputPath), promises_1.default.unlink(outputPath)]);
    return output;
}
//# sourceMappingURL=imageService.js.map