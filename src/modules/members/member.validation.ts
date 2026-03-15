import { z } from "zod";

export const memberListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const updateMemberSchema = z.object({
  bio: z.string().trim().max(500).optional(),
  profilePhoto: z.string().url().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
