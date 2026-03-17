CREATE TYPE "Role_new" AS ENUM ('USER', 'SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'MEMBER');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING ("role"::text::"Role_new");

DROP TYPE "Role";

ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

UPDATE "User" u
SET "role" = 'USER'
WHERE u."role" = 'MEMBER'
  AND NOT EXISTS (
    SELECT 1
    FROM "MemberProfile" mp
    WHERE mp."userId" = u."id"
  );
