"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDonationCampaignSchema = void 0;
const zod_1 = require("zod");
exports.upsertDonationCampaignSchema = zod_1.z.object({
    body: zod_1.z.object({
        eyebrow: zod_1.z.string().trim().min(1),
        title: zod_1.z.string().trim().min(1),
        paragraphs: zod_1.z.union([
            zod_1.z.array(zod_1.z.string().trim().min(1)).min(1),
            zod_1.z.string().min(1),
        ]),
        closingLine: zod_1.z.string().trim().min(1),
        imageUrl: zod_1.z.string().url().optional(),
        imageUrls: zod_1.z.union([zod_1.z.array(zod_1.z.string().url()), zod_1.z.string().min(1)]).optional(),
        galleryItems: zod_1.z.union([
            zod_1.z.array(zod_1.z.object({ url: zod_1.z.string().url(), caption: zod_1.z.string().trim().min(1) })),
            zod_1.z.string().min(1),
        ]).optional(),
        imageCaptions: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string().min(1)]).optional(),
        donationUrl: zod_1.z.string().url().optional(),
        impactFacts: zod_1.z.union([
            zod_1.z.array(zod_1.z.object({
                value: zod_1.z.string().trim().min(1),
                label: zod_1.z.string().trim().min(1),
                detail: zod_1.z.string().trim().min(1),
            })),
            zod_1.z.string().min(1),
        ]).optional(),
    }),
});
//# sourceMappingURL=donationCampaign.js.map