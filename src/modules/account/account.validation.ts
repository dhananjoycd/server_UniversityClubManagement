import { z } from "zod";

export const updateAccountProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  academicSession: z.string().trim().min(1).max(50).optional(),
  department: z.string().trim().min(1).max(120).optional(),
  studentId: z.string().trim().min(1).max(50).optional(),
  district: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional(),
  profilePhoto: z.string().url().optional(),
});
