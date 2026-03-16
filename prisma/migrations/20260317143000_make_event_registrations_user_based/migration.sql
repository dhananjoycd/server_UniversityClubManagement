ALTER TABLE "EventRegistration" ADD COLUMN "userId" TEXT;

UPDATE "EventRegistration" er
SET "userId" = mp."userId"
FROM "MemberProfile" mp
WHERE er."memberId" = mp."id";

ALTER TABLE "EventRegistration" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "EventRegistration" ALTER COLUMN "memberId" DROP NOT NULL;

ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventRegistration" DROP CONSTRAINT IF EXISTS "EventRegistration_eventId_memberId_key";
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");
