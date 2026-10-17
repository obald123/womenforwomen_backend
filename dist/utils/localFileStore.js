"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_FILE_PREFIX = void 0;
exports.saveLocalFile = saveLocalFile;
exports.isLocalFileReference = isLocalFileReference;
exports.resolveLocalFilePath = resolveLocalFilePath;
exports.deleteLocalFile = deleteLocalFile;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// Documents stored on the backend's own disk instead of Cloudinary, so there's no
// per-file size cap beyond what the server's disk can hold. References to these are
// stored in the DB as `local:<subfolder>/<storedName>` to distinguish them from the
// http(s) Cloudinary URLs used by everything else.
const UPLOADS_ROOT = path_1.default.join(process.cwd(), "uploads");
exports.LOCAL_FILE_PREFIX = "local:";
async function saveLocalFile(file, subfolder) {
    const dir = path_1.default.join(UPLOADS_ROOT, subfolder);
    await promises_1.default.mkdir(dir, { recursive: true });
    const ext = path_1.default.extname(file.originalname || "");
    const storedName = `${crypto_1.default.randomUUID()}${ext}`;
    await promises_1.default.writeFile(path_1.default.join(dir, storedName), file.buffer);
    return { reference: `${exports.LOCAL_FILE_PREFIX}${subfolder}/${storedName}` };
}
function isLocalFileReference(value) {
    return value.startsWith(exports.LOCAL_FILE_PREFIX);
}
// path.basename strips any directory components, so a malformed/tampered reference
// can't be used to read a file outside the intended subfolder.
function resolveLocalFilePath(reference) {
    const relative = reference.slice(exports.LOCAL_FILE_PREFIX.length);
    const subfolder = path_1.default.dirname(relative);
    const filename = path_1.default.basename(relative);
    return path_1.default.join(UPLOADS_ROOT, subfolder, filename);
}
async function deleteLocalFile(reference) {
    try {
        await promises_1.default.unlink(resolveLocalFilePath(reference));
    }
    catch {
        // Already gone or never existed — nothing to clean up.
    }
}
//# sourceMappingURL=localFileStore.js.map