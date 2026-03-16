-- AlterTable
ALTER TABLE "JobOpening" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GeneralApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeUrl" TEXT,
    "supportingUrl" TEXT,
    "coverLetter" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneralApplication_status_idx" ON "GeneralApplication"("status");
