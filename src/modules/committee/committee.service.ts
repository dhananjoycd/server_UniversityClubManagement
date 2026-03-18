import { MemberStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";

const assignmentInclude = {
  memberProfile: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          academicSession: true,
          image: true,
        },
      },
    },
  },
} as const;

const normalizeCommitteePosition = (value: string) => value.trim().toLowerCase();
const normalizeCommitteeSessionLabel = (value: string) => value.trim().toLowerCase();

const buildPublicAssignment = (assignment: any) => ({
  id: assignment.id,
  memberProfileId: assignment.memberProfileId,
  memberId: assignment.memberProfile.user.id,
  name: assignment.memberProfile.user.name || assignment.memberProfile.user.email,
  role: assignment.positionTitle,
  department: assignment.memberProfile.user.department,
  academicSession: assignment.memberProfile.user.academicSession,
  wing: assignment.committeeWing,
  bio: assignment.bioOverride || assignment.memberProfile.bio || undefined,
  photoUrl: assignment.photoUrlOverride || assignment.memberProfile.profilePhoto || assignment.memberProfile.user.image || undefined,
  facebookUrl: assignment.facebookUrl || undefined,
  linkedinUrl: assignment.linkedinUrl || undefined,
  whatsapp: assignment.whatsapp || assignment.memberProfile.user.phone || undefined,
  email: assignment.memberProfile.user.email,
  sortOrder: assignment.sortOrder,
});

const buildSession = (session: any) => ({
  id: session.id,
  label: session.label,
  title: session.title,
  description: session.description,
  coverImageUrl: session.coverImageUrl,
  isActive: session.isActive,
  displayOrder: session.displayOrder,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  assignments: session.assignments
    .filter((assignment: any) => assignment.isActive)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    .map(buildPublicAssignment),
});

const getPublicCommittee = async () => {
  const sessions = await prisma.committeeSession.findMany({
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      assignments: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: assignmentInclude,
      },
    },
  });

  const mapped = sessions.map(buildSession);
  return {
    activeSession: mapped.find((session) => session.isActive) ?? mapped[0] ?? null,
    sessions: mapped,
  };
};

const getAdminCommitteeSessions = async () => {
  const sessions = await prisma.committeeSession.findMany({
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      assignments: {
        orderBy: { sortOrder: "asc" },
        include: assignmentInclude,
      },
    },
  });

  return sessions.map(buildSession);
};

const getEligibleMembers = async () => {
  const members = await prisma.memberProfile.findMany({
    where: { status: MemberStatus.ACTIVE },
    orderBy: { joinDate: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          academicSession: true,
          image: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.user.name || member.user.email,
    email: member.user.email,
    phone: member.user.phone,
    department: member.user.department,
    academicSession: member.user.academicSession,
    membershipId: member.membershipId,
    photoUrl: member.profilePhoto || member.user.image,
  }));
};

const createCommitteeSession = async (payload: {
  label: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}) => {
  const normalizedLabel = normalizeCommitteeSessionLabel(payload.label);
  const existingSession = await prisma.committeeSession.findMany({ select: { id: true, label: true } });

  if (existingSession.some((session) => normalizeCommitteeSessionLabel(session.label) === normalizedLabel)) {
    throw new AppError(409, `${payload.label.trim()} already exists. Choose a different session label.`);
  }

  return prisma.$transaction(async (tx) => {
    if (payload.isActive) {
      await tx.committeeSession.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    return tx.committeeSession.create({
      data: {
        label: payload.label.trim(),
        title: payload.title?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        coverImageUrl: payload.coverImageUrl?.trim() || undefined,
        isActive: payload.isActive ?? false,
        displayOrder: payload.displayOrder ?? 0,
      },
    });
  });
};

const updateCommitteeSession = async (sessionId: string, payload: {
  label?: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}) => {
  const existing = await prisma.committeeSession.findUnique({ where: { id: sessionId } });
  if (!existing) throw new AppError(404, "Committee session not found");

  return prisma.$transaction(async (tx) => {
    if (payload.isActive) {
      await tx.committeeSession.updateMany({ where: { isActive: true, NOT: { id: sessionId } }, data: { isActive: false } });
    }

    return tx.committeeSession.update({
      where: { id: sessionId },
      data: {
        ...(payload.label !== undefined ? { label: payload.label.trim() } : {}),
        ...(payload.title !== undefined ? { title: payload.title.trim() || null } : {}),
        ...(payload.description !== undefined ? { description: payload.description.trim() || null } : {}),
        ...(payload.coverImageUrl !== undefined ? { coverImageUrl: payload.coverImageUrl.trim() || null } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
      },
    });
  });
};

const deleteCommitteeSession = async (sessionId: string) => {
  const existing = await prisma.committeeSession.findUnique({ where: { id: sessionId } });
  if (!existing) throw new AppError(404, "Committee session not found");
  await prisma.committeeSession.delete({ where: { id: sessionId } });
  return { id: sessionId };
};

const createCommitteeAssignment = async (payload: {
  sessionId: string;
  memberProfileId: string;
  committeeWing: string;
  positionTitle: string;
  sortOrder?: number;
  isActive?: boolean;
  bioOverride?: string;
  photoUrlOverride?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  whatsapp?: string;
}) => {
  const [session, memberProfile, existing, duplicatePositionAssignment] = await Promise.all([
    prisma.committeeSession.findUnique({ where: { id: payload.sessionId } }),
    prisma.memberProfile.findUnique({ where: { id: payload.memberProfileId }, include: { user: true } }),
    prisma.committeeAssignment.findUnique({ where: { sessionId_memberProfileId: { sessionId: payload.sessionId, memberProfileId: payload.memberProfileId } } }),
    prisma.committeeAssignment.findMany({ where: { sessionId: payload.sessionId, isActive: true }, select: { id: true, positionTitle: true } }),
  ]);

  if (!session) throw new AppError(404, "Committee session not found");
  if (!memberProfile || memberProfile.status !== MemberStatus.ACTIVE) throw new AppError(400, "Only active members can be assigned to a committee session");
  if (existing) throw new AppError(409, "This member is already assigned in the selected committee session");
  if (duplicatePositionAssignment.some((assignment) => normalizeCommitteePosition(assignment.positionTitle) === normalizeCommitteePosition(payload.positionTitle))) {
    throw new AppError(409, `${payload.positionTitle.trim()} is already used in this committee session`);
  }

  return prisma.committeeAssignment.create({
    data: {
      sessionId: payload.sessionId,
      memberProfileId: payload.memberProfileId,
      committeeWing: payload.committeeWing.trim(),
      positionTitle: payload.positionTitle.trim(),
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
      bioOverride: payload.bioOverride?.trim() || undefined,
      photoUrlOverride: payload.photoUrlOverride?.trim() || undefined,
      facebookUrl: payload.facebookUrl?.trim() || undefined,
      linkedinUrl: payload.linkedinUrl?.trim() || undefined,
      whatsapp: payload.whatsapp?.trim() || undefined,
    },
    include: assignmentInclude,
  });
};

const updateCommitteeAssignment = async (assignmentId: string, payload: {
  committeeWing?: string;
  positionTitle?: string;
  sortOrder?: number;
  isActive?: boolean;
  bioOverride?: string;
  photoUrlOverride?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  whatsapp?: string;
}) => {
  const existing = await prisma.committeeAssignment.findUnique({ where: { id: assignmentId } });
  if (!existing) throw new AppError(404, "Committee assignment not found");

  if (payload.positionTitle !== undefined) {
    const sessionAssignments = await prisma.committeeAssignment.findMany({
      where: { sessionId: existing.sessionId, isActive: true, NOT: { id: assignmentId } },
      select: { positionTitle: true },
    });

    if (sessionAssignments.some((assignment) => normalizeCommitteePosition(assignment.positionTitle) === normalizeCommitteePosition(payload.positionTitle || ""))) {
      throw new AppError(409, `${payload.positionTitle.trim()} is already used in this committee session`);
    }
  }

  return prisma.committeeAssignment.update({
    where: { id: assignmentId },
    data: {
      ...(payload.committeeWing !== undefined ? { committeeWing: payload.committeeWing.trim() } : {}),
      ...(payload.positionTitle !== undefined ? { positionTitle: payload.positionTitle.trim() } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.bioOverride !== undefined ? { bioOverride: payload.bioOverride.trim() || null } : {}),
      ...(payload.photoUrlOverride !== undefined ? { photoUrlOverride: payload.photoUrlOverride.trim() || null } : {}),
      ...(payload.facebookUrl !== undefined ? { facebookUrl: payload.facebookUrl.trim() || null } : {}),
      ...(payload.linkedinUrl !== undefined ? { linkedinUrl: payload.linkedinUrl.trim() || null } : {}),
      ...(payload.whatsapp !== undefined ? { whatsapp: payload.whatsapp.trim() || null } : {}),
    },
    include: assignmentInclude,
  });
};

const deleteCommitteeAssignment = async (assignmentId: string) => {
  const existing = await prisma.committeeAssignment.findUnique({ where: { id: assignmentId } });
  if (!existing) throw new AppError(404, "Committee assignment not found");
  await prisma.committeeAssignment.delete({ where: { id: assignmentId } });
  return { id: assignmentId };
};

export const committeeService = {
  getPublicCommittee,
  getAdminCommitteeSessions,
  getEligibleMembers,
  createCommitteeSession,
  updateCommitteeSession,
  deleteCommitteeSession,
  createCommitteeAssignment,
  updateCommitteeAssignment,
  deleteCommitteeAssignment,
};
