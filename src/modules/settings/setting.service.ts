import { prisma } from "../../lib/prisma";

type HeroSlidePayload = {
  image: string;
  title: string;
  description: string;
  tag?: string;
};

type ImpactStatsPayload = {
  activeMembers?: number;
  eventsDelivered?: number;
  projectsShipped?: number;
  mentorsAndSeniors?: number;
};

type FaqPayload = {
  question: string;
  answer: string;
};

type TestimonialPayload = {
  quote: string;
  author: string;
  meta: string;
};

type CommitteeMemberPayload = {
  name: string;
  role: string;
  department: string;
  photoUrl?: string;
};

const getSettings = async () => {
  const existingSettings = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return existingSettings;
};

const upsertSettings = async (payload: {
  organizationName?: string;
  logoUrl?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: unknown;
  heroSlides?: HeroSlidePayload[];
  impactStats?: ImpactStatsPayload;
  faqs?: FaqPayload[];
  testimonials?: TestimonialPayload[];
  committeeMembers?: CommitteeMemberPayload[];
  aboutText?: string;
}) => {
  const existingSettings = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!existingSettings) {
    return prisma.siteSetting.create({
      data: {
        organizationName: payload.organizationName ?? "Club Portal",
        logoUrl: payload.logoUrl,
        contactEmail: payload.contactEmail,
        phone: payload.phone,
        socialLinks: payload.socialLinks as never,
        heroSlides: payload.heroSlides as never,
        impactStats: payload.impactStats as never,
        faqs: payload.faqs as never,
        testimonials: payload.testimonials as never,
        committeeMembers: payload.committeeMembers as never,
        aboutText: payload.aboutText,
      },
    });
  }

  return prisma.siteSetting.update({
    where: { id: existingSettings.id },
    data: {
      ...(payload.organizationName !== undefined ? { organizationName: payload.organizationName } : {}),
      ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.contactEmail !== undefined ? { contactEmail: payload.contactEmail } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.socialLinks !== undefined ? { socialLinks: payload.socialLinks as never } : {}),
      ...(payload.heroSlides !== undefined ? { heroSlides: payload.heroSlides as never } : {}),
      ...(payload.impactStats !== undefined ? { impactStats: payload.impactStats as never } : {}),
      ...(payload.faqs !== undefined ? { faqs: payload.faqs as never } : {}),
      ...(payload.testimonials !== undefined ? { testimonials: payload.testimonials as never } : {}),
      ...(payload.committeeMembers !== undefined ? { committeeMembers: payload.committeeMembers as never } : {}),
      ...(payload.aboutText !== undefined ? { aboutText: payload.aboutText } : {}),
    },
  });
};

export const settingService = {
  getSettings,
  upsertSettings,
};
