import { z } from "zod";

export const noticeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  audience: z.enum(["ALL", "MEMBERS", "ADMINS"]).optional(),
});

export const createNoticeSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  audience: z.enum(["ALL", "MEMBERS", "ADMINS"]),
});

export const updateNoticeSchema = createNoticeSchema.partial();
