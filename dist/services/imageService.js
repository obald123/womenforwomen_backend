"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCloudImage = saveCloudImage;
exports.saveCloudFile = saveCloudFile;
exports.saveCloudVideo = saveCloudVideo;
const cloudinary_1 = require("cloudinary");
const sharp_1 = __importDefault(require("sharp"));
const env_1 = require("../config/env");
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
async function saveCloudVideo(file, folder) {
    const compressed = await compressVideoBuffer(file.buffer);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "video",
        }, (error, result) => {
            if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed"));
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