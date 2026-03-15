import { z } from "zod";

export const upsertSettingSchema = z.object({
  organizationName: z.string().trim().min(1).optional(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().trim().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  aboutText: z.string().trim().optional(),
});
