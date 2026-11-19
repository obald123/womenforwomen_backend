"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicDonationCampaign = getPublicDonationCampaign;
exports.upsertDonationCampaign = upsertDonationCampaign;
const prisma_1 = require("../../config/prisma");
const auditService_1 = require("../../services/auditService");
const imageService_1 = require("../../services/imageService");
const errors_1 = require("../../utils/errors");
const CAMPAIGN_ID = "giving-tuesday-2026";
async function getPublicDonationCampaign(_req, res) {
    const campaign = await prisma_1.prisma.donationCampaign.findUnique({
        where: { id: CAMPAIGN_ID },
    });
    if (!campaign)
        throw new errors_1.NotFoundError("Donation campaign not found");
    res.json({ success: true, data: campaign });
}
async function upsertDonationCampaign(req, res) {
    const body = req.body;
    let paragraphs;
    try {
        const parsed = typeof body.paragraphs === "string" ? JSON.parse(body.paragraphs) : body.paragraphs;
        if (!Array.isArray(parsed) || !parsed.every((paragraph) => typeof paragraph === "string")) {
            throw new Error("Expected an array of paragraph strings");
        }
        paragraphs = parsed;
    }
    catch {
        throw new errors_1.ValidationError("paragraphs must be an array of strings");
    }
    let suppliedImageUrls;
    if (body.imageUrls !== undefined) {
        try {
            const parsed = typeof body.imageUrls === "string" ? JSON.parse(body.imageUrls) : body.imageUrls;
            if (!Array.isArray(parsed) || !parsed.every((url) => typeof url === "string")) {
                throw new Error("Expected an array of image URLs");
            }
            suppliedImageUrls = parsed;
        }
        catch {
            throw new errors_1.ValidationError("imageUrls must be an array of URLs");
        }
    }
    let suppliedGalleryItems;
    if (body.galleryItems !== undefined) {
        try {
            const parsed = typeof body.galleryItems === "string" ? JSON.parse(body.galleryItems) : body.galleryItems;
            if (!Array.isArray(parsed) ||
                !parsed.every((item) => typeof item?.url === "string" &&
                    typeof item?.caption === "string" &&
                    item.caption.trim().length > 0)) {
                throw new Error("Expected gallery items with a URL and caption");
            }
            suppliedGalleryItems = parsed;
        }
        catch {
            throw new errors_1.ValidationError("galleryItems must be an array of image URLs and captions");
        }
    }
    let imageCaptions = [];
    if (body.imageCaptions !== undefined) {
        try {
            const parsed = typeof body.imageCaptions === "string" ? JSON.parse(body.imageCaptions) : body.imageCaptions;
            if (!Array.isArray(parsed) || !parsed.every((caption) => typeof caption === "string")) {
                throw new Error("Expected an array of captions");
            }
            imageCaptions = parsed;
        }
        catch {
            throw new errors_1.ValidationError("imageCaptions must be an array of strings");
        }
    }
    let impactFacts = [];
    if (body.impactFacts !== undefined) {
        try {
            const parsed = typeof body.impactFacts === "string" ? JSON.parse(body.impactFacts) : body.impactFacts;
            if (!Array.isArray(parsed))
                throw new Error("Expected an array of impact facts");
            impactFacts = parsed;
        }
        catch {
            throw new errors_1.ValidationError("impactFacts must be an array of impact facts");
        }
    }
    const existing = await prisma_1.prisma.donationCampaign.findUnique({ where: { id: CAMPAIGN_ID } });
    const files = req.files;
    const coverFile = files?.image?.[0];
    const uploadedImage = coverFile ? await (0, imageService_1.saveCloudImage)(coverFile, "wfw/donation-campaigns") : undefined;
    const imageUrl = uploadedImage?.url ??
        (typeof body.imageUrl === "string" ? body.imageUrl : existing?.imageUrl);
    if (!imageUrl) {
        throw new errors_1.ValidationError("An image file or imageUrl is required to create the campaign");
    }
    const uploadedGalleryImages = await Promise.all((files?.images ?? []).map((file) => (0, imageService_1.saveCloudImage)(file, "wfw/donation-campaigns")));
    const currentImageUrls = Array.isArray(existing?.imageUrls)
        ? existing.imageUrls.filter((url) => typeof url === "string")
        : [];
    const existingGalleryItems = Array.isArray(existing?.galleryItems)
        ? existing.galleryItems.filter((item) => typeof item === "object" &&
            item !== null &&
            "url" in item &&
            "caption" in item &&
            typeof item.url === "string" &&
            typeof item.caption === "string")
        : [];
    const baseGalleryItems = suppliedGalleryItems ??
        (existingGalleryItems.length
            ? existingGalleryItems
            : (suppliedImageUrls ?? currentImageUrls).map((url, index) => ({
                url,
                caption: `Women building skills and livelihoods · ${index + 1}`,
            })));
    const galleryItems = [
        ...baseGalleryItems,
        ...uploadedGalleryImages.map((image, index) => ({
            url: image.url,
            caption: imageCaptions[index] || `Women building skills and livelihoods · ${index + 1}`,
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
        galleryItems: galleryItems.length ? galleryItems : [{ url: imageUrl, caption: "Women building skills and livelihoods" }],
        impactFacts: body.impactFacts !== undefined ? impactFacts : existing?.impactFacts ?? [],
        donationUrl: typeof body.donationUrl === "string"
            ? body.donationUrl
            : existing?.donationUrl ??
                "https://www.globalgiving.org/projects/help-rwandan-women-learn-earn-and-thrive/",
        ctaLabel: "Donate now",
    };
    const campaign = await prisma_1.prisma.donationCampaign.upsert({
        where: { id: CAMPAIGN_ID },
        create: { id: CAMPAIGN_ID, ...data },
        update: data,
    });
    await (0, auditService_1.logAudit)("donationCampaign.upsert", req.user?.id ?? null, { id: campaign.id });
    res.json({ success: true, data: campaign });
}
//# sourceMappingURL=controller.js.map