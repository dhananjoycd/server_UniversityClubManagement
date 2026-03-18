-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "currency" SET DEFAULT 'bdt';

-- CreateTable
CREATE TABLE "CommitteeSession" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeAssignment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "committeeWing" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bioOverride" TEXT,
    "photoUrlOverride" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "whatsapp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "reviewReason" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeSession_label_key" ON "CommitteeSession"("label");

-- CreateIndex
CREATE INDEX "CommitteeAssignment_sessionId_sortOrder_idx" ON "CommitteeAssignment"("sessionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeAssignment_sessionId_memberProfileId_key" ON "CommitteeAssignment"("sessionId", "memberProfileId");

-- CreateIndex
CREATE INDEX "Testimonial_status_displayOrder_createdAt_idx" ON "Testimonial"("status", "displayOrder", "createdAt");

-- AddForeignKey
ALTER TABLE "CommitteeAssignment" ADD CONSTRAINT "CommitteeAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CommitteeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeAssignment" ADD CONSTRAINT "CommitteeAssignment_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
