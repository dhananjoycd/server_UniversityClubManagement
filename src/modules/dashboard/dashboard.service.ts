import { prisma } from "../../lib/prisma";

const getAdminDashboard = async () => {
  const [totalMembers, pendingApplications, totalEvents, recentNotices] = await Promise.all([
    prisma.memberProfile.count(),
    prisma.membershipApplication.count({ where: { status: "PENDING" } }),
    prisma.event.count(),
    prisma.notice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    totalMembers,
    pendingApplications,
    totalEvents,
    recentNotices,
  };
};

const getMemberDashboard = async (userId: string) => {
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId },
    include: {
      registrations: {
        where: { status: { in: ["REGISTERED", "WAITLISTED"] } },
        include: { event: true },
      },
    },
  });

  const upcomingEvents = await prisma.event.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    take: 5,
  });

  return {
    profileStatus: memberProfile?.status ?? null,
    upcomingEvents,
    registeredEvents: memberProfile?.registrations ?? [],
  };
};

export const dashboardService = {
  getAdminDashboard,
  getMemberDashboard,
};

