import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Documents stored on the backend's own disk instead of Cloudinary, so there's no
// per-file size cap beyond what the server's disk can hold. References to these are
// stored in the DB as `local:<subfolder>/<storedName>` to distinguish them from the
// http(s) Cloudinary URLs used by everything else.
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const LOCAL_FILE_PREFIX = "local:";

export async function saveLocalFile(file: Express.Multer.File, subfolder: string) {
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });

  const ext = path.extname(file.originalname || "");
  const storedName = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, storedName), file.buffer);

  return { reference: `${LOCAL_FILE_PREFIX}${subfolder}/${storedName}` };
}

export function isLocalFileReference(value: string) {
  return value.startsWith(LOCAL_FILE_PREFIX);
}

// path.basename strips any directory components, so a malformed/tampered reference
// can't be used to read a file outside the intended subfolder.
export function resolveLocalFilePath(reference: string) {
  const relative = reference.slice(LOCAL_FILE_PREFIX.length);
  const subfolder = path.dirname(relative);
  const filename = path.basename(relative);
  return path.join(UPLOADS_ROOT, subfolder, filename);
}

export async function deleteLocalFile(reference: string) {
  try {
    await fs.unlink(resolveLocalFilePath(reference));
  } catch {
    // Already gone or never existed — nothing to clean up.
  }
}
