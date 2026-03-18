import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  role: z.enum(["USER", "MEMBER", "ADMIN", "SUPER_ADMIN", "EVENT_MANAGER"]).optional(),
  applicationStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "NONE"]).optional(),
  membershipStatus: z.enum(["ACTIVE", "SUSPENDED", "NONE"]).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "MEMBER", "ADMIN", "EVENT_MANAGER"]),
});
