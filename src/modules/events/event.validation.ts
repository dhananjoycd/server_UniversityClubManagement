import { z } from "zod";

const eventCategories = ["Workshop", "Seminar", "Webinar", "Hackathon", "Competition", "Tech Talk", "Bootcamp", "Meetup"] as const;
const eventTypeEnum = z.enum(["FREE", "PAID"]);

const eventSchemaShape = {
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  location: z.string().trim().min(1),
  eventDate: z.string().datetime(),
  capacity: z.coerce.number().int().positive(),
  category: z.enum(eventCategories).optional(),
  eventType: eventTypeEnum.default("FREE"),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  imageUrl: z.string().url().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isRegistrationOpen: z.coerce.boolean().optional(),
};

const eventObjectSchema = z.object(eventSchemaShape);

const addPaidEventValidation = (schema: typeof eventObjectSchema | ReturnType<typeof eventObjectSchema.partial>) =>
  schema.superRefine((value, ctx) => {
    if (value.eventType === "PAID" && (value.price === undefined || value.price <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["price"], message: "Price is required for paid events" });
    }
  });

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  searchTerm: z.string().trim().optional(),
  upcomingOnly: z.coerce.boolean().optional(),
  category: z.enum(eventCategories).optional(),
  featuredOnly: z.coerce.boolean().optional(),
});

export const createEventSchema = addPaidEventValidation(eventObjectSchema);
export const updateEventSchema = addPaidEventValidation(eventObjectSchema.partial());
