import { ApplicationStatus, MemberStatus, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

type UserListQuery = Record<string, unknown>;

const requiredProfileFields = ["name", "email", "phone", "academicSession", "department", "studentId"] as const;

const isProfileComplete = (user: {
  name: string | null;
  email: string;
  phone: string | null;
  academicSession: string | null;
  department: string | null;
  studentId: string | null;
}) => requiredProfileFields.every((field) => Boolean(user[field]));

const buildUserRow = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  academicSession: user.academicSession,
  department: user.department,
  studentId: user.studentId,
  district: user.district,
  role: user.role,
  createdAt: user.createdAt,
  profileComplete: isProfileComplete(user),
  latestApplication: user.membershipApplications[0]
    ? {
        id: user.membershipApplications[0].id,
        status: user.membershipApplications[0].status,
        submittedAt: user.membershipApplications[0].submittedAt,
        reviewedAt: user.membershipApplications[0].reviewedAt,
        reviewReason: user.membershipApplications[0].reviewReason,
      }
    : null,
  memberProfile: user.memberProfile
    ? {
        id: user.memberProfile.id,
        membershipId: user.memberProfile.membershipId,
        status: user.memberProfile.status,
        joinDate: user.memberProfile.joinDate,
      }
    : null,
  registrationsCount: user._count.registrations,
});

const getUsers = async (query: UserListQuery) => {
  const { page, limit, searchTerm } = queryBuilder(query);
  const role = typeof query.role === "string" ? (query.role as Role) : undefined;
  const applicationStatus = typeof query.applicationStatus === "string" ? query.applicationStatus : undefined;
  const membershipStatus = typeof query.membershipStatus === "string" ? query.membershipStatus : undefined;

  const baseWhere = {
    ...(role ? { role } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" as const } },
            { email: { contains: searchTerm, mode: "insensitive" as const } },
            { phone: { contains: searchTerm, mode: "insensitive" as const } },
            { academicSession: { contains: searchTerm, mode: "insensitive" as const } },
            { department: { contains: searchTerm, mode: "insensitive" as const } },
            { studentId: { contains: searchTerm, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const allUsers = await prisma.user.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    include: {
      membershipApplications: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
      memberProfile: {
        select: { id: true, membershipId: true, status: true, joinDate: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  const filteredUsers = allUsers.filter((user) => {
    const latestApplicationStatus = user.membershipApplications[0]?.status ?? "NONE";
    const memberState = user.memberProfile?.status ?? "NONE";

    if (applicationStatus && latestApplicationStatus !== applicationStatus) {
      return false;
    }

    if (membershipStatus && memberState !== membershipStatus) {
      return false;
    }

    return true;
  });

  const start = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(start, start + limit).map(buildUserRow);

  const [totalUsers, totalMembers, pendingApplicants, admins] = await Promise.all([
    prisma.user.count(),
    prisma.memberProfile.count(),
    prisma.membershipApplication.count({ where: { status: ApplicationStatus.PENDING } }),
    prisma.user.count({ where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } } }),
  ]);

  return {
    meta: { page, limit, total: filteredUsers.length },
    summary: { totalUsers, totalMembers, pendingApplicants, admins },
    result: paginatedUsers,
  };
};

const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      membershipApplications: {
        orderBy: { submittedAt: "desc" },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      memberProfile: true,
      registrations: {
        orderBy: { registeredAt: "desc" },
        include: {
          event: {
            select: { id: true, title: true, location: true, eventDate: true, eventType: true, price: true },
          },
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profileComplete: isProfileComplete(user),
    memberProfile: user.memberProfile,
    applications: user.membershipApplications,
    registrations: user.registrations,
    registrationsCount: user._count.registrations,
  };
};

const updateUserRole = async (targetUserId: string, actorId: string, actorRole: Role, payload: { role: Role }) => {
  if (actorRole !== Role.SUPER_ADMIN) {
    throw new AppError(403, "Only a super admin can update user roles");
  }

  if (targetUserId === actorId) {
    throw new AppError(400, "You cannot change your own role here");
  }

  const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!existingUser) {
    throw new AppError(404, "User not found");
  }

  if (existingUser.role === Role.SUPER_ADMIN) {
    throw new AppError(403, "Super admin accounts cannot be changed from this page");
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: payload.role },
    select: { id: true, name: true, email: true, role: true },
  });

  return updatedUser;
};

export const userService = {
  getUsers,
  getUserById,
  updateUserRole,
};
