ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "studentId" TEXT,
  ADD COLUMN IF NOT EXISTS "district" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_studentId_key"
  ON "User"("studentId");
