ALTER TABLE "MemberProfile"
  ADD COLUMN IF NOT EXISTS "studentId" TEXT,
  ADD COLUMN IF NOT EXISTS "district" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MemberProfile_studentId_key"
  ON "MemberProfile"("studentId");
