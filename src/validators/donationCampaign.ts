import { z } from "zod";

export const upsertDonationCampaignSchema = z.object({
  body: z.object({
    eyebrow: z.string().trim().min(1),
    title: z.string().trim().min(1),
    paragraphs: z.union([
      z.array(z.string().trim().min(1)).min(1),
      z.string().min(1),
    ]),
    closingLine: z.string().trim().min(1),
    imageUrl: z.string().url().optional(),
    imageUrls: z.union([z.array(z.string().url()), z.string().min(1)]).optional(),
    galleryItems: z.union([
      z.array(z.object({ url: z.string().url(), caption: z.string().trim().min(1) })),
      z.string().min(1),
    ]).optional(),
    imageCaptions: z.union([z.array(z.string()), z.string().min(1)]).optional(),
    donationUrl: z.string().url().optional(),
    impactFacts: z.union([
      z.array(
        z.object({
          value: z.string().trim().min(1),
          label: z.string().trim().min(1),
          detail: z.string().trim().min(1),
        }),
      ),
      z.string().min(1),
    ]).optional(),
  }),
});
