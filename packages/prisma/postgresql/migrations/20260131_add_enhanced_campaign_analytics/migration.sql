-- AlterEnum
ALTER TYPE "RecipientStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- AlterTable
ALTER TABLE "CampaignRecipient" 
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "errorCode" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignRecipient_messageId_idx" ON "CampaignRecipient"("messageId");
