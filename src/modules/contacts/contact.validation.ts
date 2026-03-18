import { ContactMessageCategory, ContactMessageStatus } from "@prisma/client";
import { z } from "zod";

export const createContactMessageSchema = z.object({
  category: z.nativeEnum(ContactMessageCategory),
  phone: z.string().trim().min(7, "Add a valid phone number.").max(30, "Keep the phone number within 30 characters.").optional(),
  subject: z.string().trim().min(5, "Write a subject with at least 5 characters.").max(140, "Keep the subject within 140 characters."),
  message: z.string().trim().min(20, "Write at least 20 characters so the admin team can understand the issue.").max(1500, "Keep the message within 1500 characters."),
});

export const contactMessageListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(ContactMessageStatus).optional(),
  category: z.nativeEnum(ContactMessageCategory).optional(),
  searchTerm: z.string().trim().optional(),
});

export const reviewContactMessageSchema = z.object({
  status: z.nativeEnum(ContactMessageStatus),
  adminNote: z.string().trim().max(500, "Keep the admin note within 500 characters.").optional(),
});
