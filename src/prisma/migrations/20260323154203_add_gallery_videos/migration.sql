-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "videos" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "GeneralApplication" ADD COLUMN     "resumeName" TEXT,
ADD COLUMN     "resumeType" TEXT,
ADD COLUMN     "supportingName" TEXT,
ADD COLUMN     "supportingType" TEXT;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "resumeName" TEXT,
ADD COLUMN     "resumeType" TEXT,
ADD COLUMN     "supportingName" TEXT,
ADD COLUMN     "supportingType" TEXT;
