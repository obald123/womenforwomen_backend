-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "badgeLabel" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;
