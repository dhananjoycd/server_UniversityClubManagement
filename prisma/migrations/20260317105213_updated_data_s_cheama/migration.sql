-- AlterEnum
CREATE TYPE "MemberStatus_new" AS ENUM ('INACTIVE', 'ACTIVE', 'SUSPENDED');

ALTER TABLE "MemberProfile" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "MemberProfile"
ALTER COLUMN "status" TYPE "MemberStatus_new"
USING ("status"::text::"MemberStatus_new");

DROP TYPE "MemberStatus";

ALTER TYPE "MemberStatus_new" RENAME TO "MemberStatus";

-- DropIndex
DROP INDEX "EventRegistration_eventId_memberId_key";

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Event'
      AND column_name = 'currency'
  ) THEN
    ALTER TABLE "Event" ALTER COLUMN "currency" SET DEFAULT 'bdt';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "MemberProfile" ALTER COLUMN "status" SET DEFAULT 'INACTIVE';
