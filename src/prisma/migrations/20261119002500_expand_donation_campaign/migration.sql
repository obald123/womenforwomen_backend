ALTER TABLE "DonationCampaign"
ADD COLUMN "imageUrls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "impactFacts" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "donationUrl" TEXT NOT NULL DEFAULT 'https://www.globalgiving.org/projects/help-rwandan-women-learn-earn-and-thrive/',
ALTER COLUMN "ctaLabel" SET DEFAULT 'Donate now';

UPDATE "DonationCampaign"
SET "ctaLabel" = 'Donate now'
WHERE "id" = 'giving-tuesday-2026';
