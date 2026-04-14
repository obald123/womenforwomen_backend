import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { env } from "../config/env";
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
  const processed = await sharp(file.buffer)
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  if (processed.length > 10 * 1024 * 1024) {
    throw new Error("Compressed image is still above 10MB. Please upload a smaller image.");
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
          reject(error ?? new Error("Cloudinary upload failed"));
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
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(file.buffer);
  });
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
          reject(error ?? new Error("Cloudinary upload failed"));
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
