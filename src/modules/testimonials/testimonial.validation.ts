import { TestimonialStatus } from "@prisma/client";
import { z } from "zod";

export const createTestimonialSchema = z.object({
  quote: z.string().trim().min(20, "Write at least 20 characters.").max(600, "Keep the testimonial within 600 characters."),
  meta: z.string().trim().min(2, "Add a short role or context.").max(120, "Keep the meta short."),
});

export const testimonialListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(TestimonialStatus).optional(),
  searchTerm: z.string().trim().optional(),
});

export const reviewTestimonialSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewReason: z.string().trim().max(300).optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});
