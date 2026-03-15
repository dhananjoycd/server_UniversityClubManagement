import { z } from "zod";

export const createApplicationSchema = z.object({
  department: z.string().trim().min(1),
  session: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  district: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().trim().optional(),
});

export const applicationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
