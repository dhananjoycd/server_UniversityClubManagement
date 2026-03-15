import { z } from "zod";

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  location: z.string().trim().min(1),
  eventDate: z.string().datetime(),
  capacity: z.coerce.number().int().positive(),
});

export const updateEventSchema = createEventSchema.partial();
