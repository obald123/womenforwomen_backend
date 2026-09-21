// One-off backfill: assigns a stable `id` to every gallery image/video entry
// that predates per-item add/delete/caption support, so they become
// individually manageable. Run once with: npx ts-node src/prisma/backfillGalleryMediaIds.ts
import crypto from "crypto";
import { prisma } from "../config/prisma";

type LegacyMedia = { id?: string; url: string; publicId?: string | null; caption?: string };

function backfill(items: unknown): { items: LegacyMedia[]; changed: boolean } {
  if (!Array.isArray(items)) return { items: [], changed: false };
  let changed = false;
  const result = (items as LegacyMedia[]).map((item) => {
    if (item.id) return item;
    changed = true;
    return { ...item, id: crypto.randomUUID(), publicId: item.publicId ?? null };
  });
  return { items: result, changed };
}

async function main() {
  const galleries = await prisma.gallery.findMany();
  for (const gallery of galleries) {
    const images = backfill(gallery.images);
    const videos = backfill(gallery.videos);
    if (!images.changed && !videos.changed) continue;

    await prisma.gallery.update({
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
  .finally(() => prisma.$disconnect());
