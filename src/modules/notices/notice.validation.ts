import { z } from "zod";

const noticeAudienceEnum = z.enum(["ALL", "USERS", "APPLICANTS", "MEMBERS", "EVENT_MANAGERS", "ADMINS"]);

export const noticeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  audience: noticeAudienceEnum.optional(),
});

export const createNoticeSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  audience: noticeAudienceEnum,
  sendEmail: z.boolean().optional().default(false),
});

export const updateNoticeSchema = createNoticeSchema.partial();
