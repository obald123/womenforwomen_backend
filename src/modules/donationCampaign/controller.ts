import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { logAudit } from "../../services/auditService";
import { saveCloudImage } from "../../services/imageService";
import { NotFoundError, ValidationError } from "../../utils/errors";

const CAMPAIGN_ID = "giving-tuesday-2026";

export async function getPublicDonationCampaign(_req: Request, res: Response) {
  const campaign = await prisma.donationCampaign.findUnique({
    where: { id: CAMPAIGN_ID },
  });
  if (!campaign) throw new NotFoundError("Donation campaign not found");
  res.json({ success: true, data: campaign });
}

export async function upsertDonationCampaign(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  let paragraphs: string[];
  try {
    const parsed = typeof body.paragraphs === "string" ? JSON.parse(body.paragraphs) : body.paragraphs;
    if (!Array.isArray(parsed) || !parsed.every((paragraph) => typeof paragraph === "string")) {
      throw new Error("Expected an array of paragraph strings");
    }
    paragraphs = parsed;
  } catch {
    throw new ValidationError("paragraphs must be an array of strings");
  }

  let suppliedImageUrls: string[] | undefined;
  if (body.imageUrls !== undefined) {
    try {
      const parsed = typeof body.imageUrls === "string" ? JSON.parse(body.imageUrls) : body.imageUrls;
      if (!Array.isArray(parsed) || !parsed.every((url) => typeof url === "string")) {
        throw new Error("Expected an array of image URLs");
      }
      suppliedImageUrls = parsed;
    } catch {
      throw new ValidationError("imageUrls must be an array of URLs");
    }
  }

  let suppliedGalleryItems: Array<{ url: string; caption: string }> | undefined;
  if (body.galleryItems !== undefined) {
    try {
      const parsed = typeof body.galleryItems === "string" ? JSON.parse(body.galleryItems) : body.galleryItems;
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (item) =>
            typeof item?.url === "string" &&
            typeof item?.caption === "string" &&
            item.caption.trim().length > 0,
        )
      ) {
        throw new Error("Expected gallery items with a URL and caption");
      }
      suppliedGalleryItems = parsed as Array<{ url: string; caption: string }>;
    } catch {
      throw new ValidationError("galleryItems must be an array of image URLs and captions");
    }
  }

  let imageCaptions: string[] = [];
  if (body.imageCaptions !== undefined) {
    try {
      const parsed =
        typeof body.imageCaptions === "string" ? JSON.parse(body.imageCaptions) : body.imageCaptions;
      if (!Array.isArray(parsed) || !parsed.every((caption) => typeof caption === "string")) {
        throw new Error("Expected an array of captions");
      }
      imageCaptions = parsed;
    } catch {
      throw new ValidationError("imageCaptions must be an array of strings");
    }
  }

  let impactFacts: Array<{ value: string; label: string; detail: string }> = [];
  if (body.impactFacts !== undefined) {
    try {
      const parsed = typeof body.impactFacts === "string" ? JSON.parse(body.impactFacts) : body.impactFacts;
      if (!Array.isArray(parsed)) throw new Error("Expected an array of impact facts");
      impactFacts = parsed as Array<{ value: string; label: string; detail: string }>;
    } catch {
      throw new ValidationError("impactFacts must be an array of impact facts");
    }
  }

  const existing = await prisma.donationCampaign.findUnique({ where: { id: CAMPAIGN_ID } });
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const coverFile = files?.image?.[0];
  const uploadedImage = coverFile ? await saveCloudImage(coverFile, "wfw/donation-campaigns") : undefined;
  const imageUrl =
    uploadedImage?.url ??
    (typeof body.imageUrl === "string" ? body.imageUrl : existing?.imageUrl);
  if (!imageUrl) {
    throw new ValidationError("An image file or imageUrl is required to create the campaign");
  }
  const uploadedGalleryImages = await Promise.all(
    (files?.images ?? []).map((file) => saveCloudImage(file, "wfw/donation-campaigns")),
  );
  const currentImageUrls = Array.isArray(existing?.imageUrls)
    ? existing.imageUrls.filter((url): url is string => typeof url === "string")
    : [];
  const existingGalleryItems = Array.isArray(existing?.galleryItems)
    ? existing.galleryItems.filter(
        (item): item is { url: string; caption: string } =>
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          "caption" in item &&
          typeof item.url === "string" &&
          typeof item.caption === "string",
      )
    : [];
  const baseGalleryItems =
    suppliedGalleryItems ??
    (existingGalleryItems.length
      ? existingGalleryItems
      : (suppliedImageUrls ?? currentImageUrls).map((url) => ({
          url,
          caption: String(body.title),
        })));
  const galleryItems = [
    ...baseGalleryItems,
    ...uploadedGalleryImages.map((image, index) => ({
      url: image.url,
      caption: imageCaptions[index] || String(body.title),
    })),
  ];
  const imageUrls = [
    ...(suppliedImageUrls ?? currentImageUrls),
    ...uploadedGalleryImages.map((image) => image.url),
  ];

  const data = {
    eyebrow: String(body.eyebrow),
    title: String(body.title),
    paragraphs,
    closingLine: String(body.closingLine),
    imageUrl,
    imageUrls: imageUrls.length ? imageUrls : [imageUrl],
    galleryItems: galleryItems.length ? galleryItems : [{ url: imageUrl, caption: String(body.title) }],
    impactFacts: body.impactFacts !== undefined ? impactFacts : existing?.impactFacts ?? [],
    donationUrl:
      typeof body.donationUrl === "string"
        ? body.donationUrl
        : existing?.donationUrl ??
          "https://www.globalgiving.org/projects/help-rwandan-women-learn-earn-and-thrive/",
    ctaLabel: "Donate now",
  };
  const campaign = await prisma.donationCampaign.upsert({
    where: { id: CAMPAIGN_ID },
    create: { id: CAMPAIGN_ID, ...data },
    update: data,
  });

  await logAudit("donationCampaign.upsert", req.user?.id ?? null, { id: campaign.id });
  res.json({ success: true, data: campaign });
}
