import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";

const buildMissingFields = (profile: {
  name?: string | null;
  email: string;
  phone?: string | null;
  academicSession?: string | null;
  department?: string | null;
  studentId?: string | null;
  district?: string | null;
}) => {
  const missing: string[] = [];
  if (!profile.name?.trim()) missing.push("name");
  if (!profile.email?.trim()) missing.push("email");
  if (!profile.phone?.trim()) missing.push("phone");
  if (!profile.academicSession?.trim()) missing.push("session");
  if (!profile.department?.trim()) missing.push("department");
  if (!profile.studentId?.trim()) missing.push("student ID");
  return missing;
};

const getAccountProfile = async (userId: string) => {
  const [user, latestApplication] = await Promise.all([
    prisma.user.findUnique({
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
    }),
    prisma.membershipApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      select: { status: true, reviewReason: true },
    }),
  ]);

  if (!user) throw new AppError(404, "Account not found");

  const missingFields = buildMissingFields(user);
  const membershipFieldsLocked = Boolean(user.memberProfile) || latestApplication?.status === "PENDING";

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    academicSession: user.academicSession,
    department: user.department,
    studentId: user.studentId,
    district: user.district,
    role: user.role,
    memberProfile: user.memberProfile,
    registrations: user.registrations,
    profileComplete: missingFields.length === 0,
    missingFields,
    isClubMember: Boolean(user.memberProfile),
    membershipFieldsLocked,
    latestApplicationStatus: latestApplication?.status ?? null,
    latestApplicationReason: latestApplication?.reviewReason ?? null,
  };
};

const updateAccountProfile = async (userId: string, payload: {
  name?: string;
  phone?: string;
  academicSession?: string;
  department?: string;
  studentId?: string;
  district?: string;
  bio?: string;
  profilePhoto?: string;
}) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, include: { memberProfile: true } });
  if (!existingUser) throw new AppError(404, "Account not found");

  const latestApplication = await prisma.membershipApplication.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    select: { id: true, status: true, phone: true, session: true, department: true, studentId: true, district: true },
  });

  const isApprovedMember = Boolean(existingUser.memberProfile);
  const hasPendingApplication = latestApplication?.status === "PENDING";
  const isMembershipFieldUpdateRequested =
    payload.phone !== undefined ||
    payload.academicSession !== undefined ||
    payload.department !== undefined ||
    payload.studentId !== undefined ||
    payload.district !== undefined;

  if (isApprovedMember && isMembershipFieldUpdateRequested) {
    throw new AppError(403, "Approved membership data cannot be changed from the profile page");
  }

  if (hasPendingApplication && isMembershipFieldUpdateRequested) {
    throw new AppError(403, "Membership fields cannot be changed while your application is under review");
  }

  const nextPhone = payload.phone ?? existingUser.phone ?? undefined;
  const nextAcademicSession = payload.academicSession ?? existingUser.academicSession ?? undefined;
  const nextDepartment = payload.department ?? existingUser.department ?? undefined;
  const nextStudentId = payload.studentId ?? existingUser.studentId ?? undefined;
  const normalizedDistrict = payload.district !== undefined ? (payload.district.trim() ? payload.district.trim() : null) : undefined;
  const nextDistrict = normalizedDistrict !== undefined ? normalizedDistrict : existingUser.district ?? undefined;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.academicSession !== undefined ? { academicSession: payload.academicSession } : {}),
        ...(payload.department !== undefined ? { department: payload.department } : {}),
        ...(payload.studentId !== undefined ? { studentId: payload.studentId } : {}),
        ...(payload.district !== undefined ? { district: normalizedDistrict } : {}),
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

    if (!existingUser.memberProfile && isMembershipFieldUpdateRequested && latestApplication?.status === "REJECTED") {
      await tx.membershipApplication.update({
        where: { id: latestApplication.id },
        data: {
          phone: nextPhone ?? latestApplication.phone,
          session: nextAcademicSession ?? latestApplication.session,
          department: nextDepartment ?? latestApplication.department,
          studentId: nextStudentId ?? latestApplication.studentId,
          district: nextDistrict ?? latestApplication.district,
        },
      });
    }
  });

  return getAccountProfile(userId);
};

export const accountService = { getAccountProfile, updateAccountProfile };
