import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";

const buildMissingFields = (profile: {
  name?: string | null;
  email: string;
  phone?: string | null;
  academicSession?: string | null;
  department?: string | null;
}) => {
  const missing: string[] = [];
  if (!profile.name?.trim()) missing.push("name");
  if (!profile.email?.trim()) missing.push("email");
  if (!profile.phone?.trim()) missing.push("phone");
  if (!profile.academicSession?.trim()) missing.push("session");
  if (!profile.department?.trim()) missing.push("department");
  return missing;
};

const getAccountProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberProfile: true,
      registrations: {
        orderBy: { registeredAt: "desc" },
        include: {
          event: true,
          member: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });

  if (!user) throw new AppError(404, "Account not found");

  const missingFields = buildMissingFields(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    academicSession: user.academicSession,
    department: user.department,
    role: user.role,
    memberProfile: user.memberProfile,
    registrations: user.registrations,
    profileComplete: missingFields.length === 0,
    missingFields,
    isClubMember: Boolean(user.memberProfile),
  };
};

const updateAccountProfile = async (userId: string, payload: {
  name?: string;
  phone?: string;
  academicSession?: string;
  department?: string;
  bio?: string;
  profilePhoto?: string;
}) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, include: { memberProfile: true } });
  if (!existingUser) throw new AppError(404, "Account not found");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.academicSession !== undefined ? { academicSession: payload.academicSession } : {}),
        ...(payload.department !== undefined ? { department: payload.department } : {}),
      },
    });

    if (existingUser.memberProfile && (payload.bio !== undefined || payload.profilePhoto !== undefined)) {
      await tx.memberProfile.update({
        where: { id: existingUser.memberProfile.id },
        data: {
          ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
          ...(payload.profilePhoto !== undefined ? { profilePhoto: payload.profilePhoto } : {}),
        },
      });
    }
  });

  return getAccountProfile(userId);
};

export const accountService = { getAccountProfile, updateAccountProfile };
