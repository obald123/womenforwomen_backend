import multer from "multer";
import { ValidationError } from "./errors";

// Allow larger uploads so we can compress before sending to Cloudinary.
// Keep images lower, but allow larger videos for gallery uploads.
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_GALLERY_FILE_SIZE = 200 * 1024 * 1024;
// Report documents are stored on the backend's own disk (see saveLocalFile), not
// Cloudinary, so they aren't bound by Cloudinary's 10MB raw-file cap — allow more room
// for image-heavy annual reports.
const MAX_REPORT_FILE_SIZE = 50 * 1024 * 1024;
const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const videoAllowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"];
const docAllowed = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(new ValidationError("Invalid file type"));
    }
    cb(null, true);
  },
});

export const uploadGallery = multer({
  storage,
  limits: { fileSize: MAX_GALLERY_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (![...allowed, ...videoAllowed].includes(file.mimetype)) {
      return cb(new ValidationError("Invalid file type"));
    }
    cb(null, true);
  },
});

export const uploadDocs = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!docAllowed.includes(file.mimetype)) {
      return cb(new ValidationError("Invalid document type"));
    }
    cb(null, true);
  },
});

// Report uploads: a document for the "file" field, plus an optional image cover.
export const uploadReport = multer({
  storage,
  limits: { fileSize: MAX_REPORT_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "coverImage") {
      if (!allowed.includes(file.mimetype)) {
        return cb(new ValidationError("Invalid image type"));
      }
      return cb(null, true);
    }
    if (!docAllowed.includes(file.mimetype)) {
      return cb(new ValidationError("Invalid document type"));
    }
    cb(null, true);
  },
});
