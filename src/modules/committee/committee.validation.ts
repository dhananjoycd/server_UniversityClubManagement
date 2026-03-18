import { z } from "zod";

const optionalCoverImageUrlSchema = z.union([z.string().trim().url(), z.literal("")]).optional();

export const createCommitteeSessionSchema = z.object({
  label: z.string().trim().min(4).max(20),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(300).optional(),
  coverImageUrl: optionalCoverImageUrlSchema,
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateCommitteeSessionSchema = createCommitteeSessionSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update.",
});

export const createCommitteeAssignmentSchema = z.object({
  sessionId: z.string().min(1),
  memberProfileId: z.string().min(1),
  committeeWing: z.string().trim().min(2).max(80),
  positionTitle: z.string().trim().min(2).max(120),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  bioOverride: z.string().trim().max(500).optional(),
  photoUrlOverride: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  whatsapp: z.string().trim().max(40).optional(),
});

export const updateCommitteeAssignmentSchema = createCommitteeAssignmentSchema.omit({ sessionId: true, memberProfileId: true }).partial().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update.",
});
