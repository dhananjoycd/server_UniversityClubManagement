DO $$
BEGIN
  CREATE TYPE "PaymentVerificationStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "EventRegistration"
  ADD COLUMN IF NOT EXISTS "paymentVerificationStatus" "PaymentVerificationStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMP(3);
