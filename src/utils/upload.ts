import multer from "multer";
import { ValidationError } from "./errors";

// Allow larger uploads so we can compress before sending to Cloudinary.
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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
