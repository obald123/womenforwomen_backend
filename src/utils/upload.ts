import multer from "multer";
import { ValidationError } from "./errors";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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
