import { prisma } from "../../lib/prisma";

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
        aboutText: payload.aboutText,
      },
    });
  }

  return prisma.siteSetting.update({
    where: { id: existingSettings.id },
    data: {
      ...(payload.organizationName !== undefined
        ? { organizationName: payload.organizationName }
        : {}),
      ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.contactEmail !== undefined ? { contactEmail: payload.contactEmail } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.socialLinks !== undefined ? { socialLinks: payload.socialLinks as never } : {}),
      ...(payload.aboutText !== undefined ? { aboutText: payload.aboutText } : {}),
    },
  });
};

export const settingService = {
  getSettings,
  upsertSettings,
};
