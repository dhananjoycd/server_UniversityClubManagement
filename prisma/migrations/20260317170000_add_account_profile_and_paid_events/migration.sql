CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "EventType" AS ENUM ('FREE', 'PAID');

ALTER TABLE "User"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "academicSession" TEXT,
  ADD COLUMN "department" TEXT;

ALTER TABLE "Event"
  ADD COLUMN "eventType" "EventType" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "price" DOUBLE PRECISION,
  ADD COLUMN "currency" TEXT DEFAULT 'usd';

ALTER TABLE "EventRegistration"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "snapshotName" TEXT,
  ADD COLUMN "snapshotEmail" TEXT,
  ADD COLUMN "snapshotPhone" TEXT,
  ADD COLUMN "snapshotSession" TEXT,
  ADD COLUMN "snapshotDepartment" TEXT,
  ADD COLUMN "paidAmount" DOUBLE PRECISION,
  ADD COLUMN "paidCurrency" TEXT,
  ADD COLUMN "stripeCheckoutSessionId" TEXT;

UPDATE "EventRegistration" er
SET
  "snapshotName" = COALESCE(u."name", ''),
  "snapshotEmail" = u."email",
  "snapshotPhone" = COALESCE(u."phone", ''),
  "snapshotSession" = COALESCE(u."academicSession", ''),
  "snapshotDepartment" = COALESCE(u."department", '')
FROM "User" u
WHERE er."userId" = u."id";

ALTER TABLE "EventRegistration"
  ALTER COLUMN "snapshotName" SET NOT NULL,
  ALTER COLUMN "snapshotEmail" SET NOT NULL,
  ALTER COLUMN "snapshotPhone" SET NOT NULL,
  ALTER COLUMN "snapshotSession" SET NOT NULL,
  ALTER COLUMN "snapshotDepartment" SET NOT NULL;

CREATE UNIQUE INDEX "EventRegistration_stripeCheckoutSessionId_key" ON "EventRegistration"("stripeCheckoutSessionId");
