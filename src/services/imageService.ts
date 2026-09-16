import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { env } from "../config/env";
import { AppError, ValidationError } from "../utils/errors";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function saveCloudImage(file: Express.Multer.File, folder: string) {
  let processed: Buffer;
  try {
    processed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new ValidationError("That image file is invalid or corrupted. Please upload a different image.");
  }

  if (processed.length > 10 * 1024 * 1024) {
    throw new ValidationError("Compressed image is still above 10MB. Please upload a smaller image.");
  }

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(toUploadError(error));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(processed);
  });
}

export async function saveCloudFile(file: Express.Multer.File, folder: string) {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
      },
      (error, result) => {
        if (error || !result) {
          reject(toUploadError(error));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(file.buffer);
  });
}

// Cloudinary rejects oversized uploads (e.g. raw files over this account's plan limit)
// with its own "File size too large" error, and separately aborts the request client-side
// after 60s with a "Request Timeout" error if its API is slow to respond — both otherwise
// surface as an opaque 500.
function toUploadError(error: unknown): Error {
  const message = (error as { message?: string; name?: string } | undefined)?.message;
  const name = (error as { message?: string; name?: string } | undefined)?.name;
  if (message && /file size too large/i.test(message)) {
    return new ValidationError("This file is too large for our file host. Please upload a smaller file.");
  }
  if (name === "TimeoutError" || (message && /request timeout/i.test(message))) {
    return new AppError("The file host took too long to respond. Please try again.", 504);
  }
  return (error as Error | undefined) ?? new Error("Cloudinary upload failed");
}

export async function saveCloudVideo(file: Express.Multer.File, folder: string) {
  const compressed = await compressVideoBuffer(file.buffer);
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
      },
      (error, result) => {
        if (error || !result) {
          reject(toUploadError(error));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(compressed);
  });
}

async function compressVideoBuffer(buffer: Buffer): Promise<Buffer> {
  if (!ffmpegPath) {
    throw new Error("FFmpeg is not available for video compression");
  }

  const tmpDir = os.tmpdir();
  const id = crypto.randomUUID();
  const inputPath = path.join(tmpDir, `wfw-video-input-${id}.mp4`);
  const outputPath = path.join(tmpDir, `wfw-video-output-${id}.mp4`);

  await fs.writeFile(inputPath, buffer);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
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
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });

  const output = await fs.readFile(outputPath);
  await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
  return output;
}
