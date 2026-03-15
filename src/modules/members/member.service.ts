import { MemberStatus, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const getMembers = async (query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const status = typeof query.status === "string" ? (query.status as MemberStatus) : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            { membershipId: { contains: searchTerm, mode: "insensitive" as const } },
            { user: { name: { contains: searchTerm, mode: "insensitive" as const } } },
            { user: { email: { contains: searchTerm, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.memberProfile.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.memberProfile.count({ where }),
  ]);

  return { meta: { page, limit, total }, result: members };
};

const getMemberById = async (memberId: string, userId: string, userRole: Role) => {
  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      registrations: {
        include: { event: true },
      },
    },
  });

  if (!member) {
    throw new AppError(404, "Member profile not found");
  }

  if (userRole === Role.MEMBER && member.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  return member;
};

const updateMember = async (
  memberId: string,
  userId: string,
  userRole: Role,
  payload: { bio?: string; profilePhoto?: string; status?: "ACTIVE" | "SUSPENDED" },
) => {
  const existingMember = await prisma.memberProfile.findUnique({
    where: { id: memberId },
  });

  if (!existingMember) {
    throw new AppError(404, "Member profile not found");
  }

  if (userRole === Role.MEMBER && existingMember.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  const data: { bio?: string; profilePhoto?: string; status?: MemberStatus } = {};

  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.profilePhoto !== undefined) data.profilePhoto = payload.profilePhoto;
  if (payload.status !== undefined) {
    if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
      throw new AppError(403, "Only admins can update member status");
    }

    data.status = payload.status;
  }

  return prisma.memberProfile.update({
    where: { id: memberId },
    data,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

export const memberService = {
  getMembers,
  getMemberById,
  updateMember,
};
