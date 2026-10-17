"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// One-off backfill: assigns a stable `id` to every gallery image/video entry
// that predates per-item add/delete/caption support, so they become
// individually manageable. Run once with: npx ts-node src/prisma/backfillGalleryMediaIds.ts
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../config/prisma");
function backfill(items) {
    if (!Array.isArray(items))
        return { items: [], changed: false };
    let changed = false;
    const result = items.map((item) => {
        if (item.id)
            return item;
        changed = true;
        return { ...item, id: crypto_1.default.randomUUID(), publicId: item.publicId ?? null };
    });
    return { items: result, changed };
}
async function main() {
    const galleries = await prisma_1.prisma.gallery.findMany();
    for (const gallery of galleries) {
        const images = backfill(gallery.images);
        const videos = backfill(gallery.videos);
        if (!images.changed && !videos.changed)
            continue;
        await prisma_1.prisma.gallery.update({
            where: { id: gallery.id },
            data: { images: images.items, videos: videos.items },
        });
        console.log(`Backfilled gallery ${gallery.id} (${gallery.title})`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma_1.prisma.$disconnect());
//# sourceMappingURL=backfillGalleryMediaIds.js.map