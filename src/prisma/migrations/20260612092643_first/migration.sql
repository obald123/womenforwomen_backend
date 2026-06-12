-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "coverImageCaption" TEXT,
ADD COLUMN     "imagesMetadata" JSONB NOT NULL DEFAULT '[]';
