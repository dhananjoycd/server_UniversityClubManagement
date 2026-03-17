import { prisma } from "../../lib/prisma";

const getAdminDashboard = async () => {
  const [totalMembers, pendingApplications, totalEvents, recentNotices] = await Promise.all([
    prisma.memberProfile.count(),
    prisma.membershipApplication.count({ where: { status: "PENDING" } }),
    prisma.event.count(),
    prisma.notice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { totalMembers, pendingApplications, totalEvents, recentNotices };
};

const getMemberDashboard = async (userId: string) => {
  const [memberProfile, registeredEvents, upcomingEvents, totalUpcomingEvents, user] = await Promise.all([
    prisma.memberProfile.findUnique({ where: { userId } }),
    prisma.eventRegistration.findMany({ where: ({ userId, status: { in: ["REGISTERED", "WAITLISTED"] }, paymentVerificationStatus: { in: ["NOT_APPLICABLE", "VERIFIED"] } } as any), include: { event: true }, orderBy: { registeredAt: "desc" } }),
    prisma.event.findMany({ where: { eventDate: { gte: new Date() } }, orderBy: { eventDate: "asc" }, take: 5 }),
    prisma.event.count({ where: { eventDate: { gte: new Date() } } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const profileComplete = Boolean(user?.name?.trim() && user?.email?.trim() && user?.phone?.trim() && user?.academicSession?.trim() && user?.department?.trim());

  return {
    profileStatus: memberProfile?.status ?? null,
    profileComplete,
    totalUpcomingEvents,
    upcomingEvents,
    registeredEvents,
  };
};

export const dashboardService = { getAdminDashboard, getMemberDashboard };
