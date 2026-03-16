import { z } from "zod";

const heroSlideSchema = z.object({
  image: z.string().url(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  tag: z.string().trim().optional(),
});

const impactStatsSchema = z.object({
  activeMembers: z.number().int().nonnegative().optional(),
  eventsDelivered: z.number().int().nonnegative().optional(),
  projectsShipped: z.number().int().nonnegative().optional(),
  mentorsAndSeniors: z.number().int().nonnegative().optional(),
});

const faqSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const testimonialSchema = z.object({
  quote: z.string().trim().min(1),
  author: z.string().trim().min(1),
  meta: z.string().trim().min(1),
});

const committeeMemberSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  department: z.string().trim().min(1),
  photoUrl: z.string().url().optional(),
});

export const upsertSettingSchema = z.object({
  organizationName: z.string().trim().min(1).optional(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().trim().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  heroSlides: z.array(heroSlideSchema).max(3).optional(),
  impactStats: impactStatsSchema.optional(),
  faqs: z.array(faqSchema).min(1).max(12).optional(),
  testimonials: z.array(testimonialSchema).max(3).optional(),
  committeeMembers: z.array(committeeMemberSchema).max(6).optional(),
  aboutText: z.string().trim().optional(),
});
