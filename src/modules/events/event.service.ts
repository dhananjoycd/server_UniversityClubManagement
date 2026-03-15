import { MemberStatus, RegistrationStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const getEvents = async (query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const upcomingOnly = query.upcomingOnly === true || query.upcomingOnly === "true";

  const where = {
    ...(upcomingOnly ? { eventDate: { gte: new Date() } } : {}),
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" as const } },
            { location: { contains: searchTerm, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: { eventDate: "asc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { meta: { page, limit, total }, result: events };
};

const getEventById = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
      registrations: {
        include: {
          member: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  return event;
};

const createEvent = async (userId: string, payload: {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
}) => {
  return prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      eventDate: new Date(payload.eventDate),
      capacity: payload.capacity,
      createdBy: userId,
    },
  });
};

const updateEvent = async (eventId: string, payload: Partial<{
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
}>) => {
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });

  if (!existingEvent) {
    throw new AppError(404, "Event not found");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.eventDate !== undefined ? { eventDate: new Date(payload.eventDate) } : {}),
      ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
    },
  });
};

const deleteEvent = async (eventId: string) => {
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });

  if (!existingEvent) {
    throw new AppError(404, "Event not found");
  }

  await prisma.event.delete({ where: { id: eventId } });
};

const registerForEvent = async (eventId: string, userId: string) => {
  const [event, memberProfile] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.memberProfile.findUnique({ where: { userId } }),
  ]);

  if (!event) {
    throw new AppError(404, "Event not found");
  }

  if (!memberProfile || memberProfile.status !== MemberStatus.ACTIVE) {
    throw new AppError(403, "An active member profile is required to register for events");
  }

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      memberId: memberProfile.id,
      status: {
        in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED],
      },
    },
  });

  if (existingRegistration) {
    throw new AppError(409, "You are already registered for this event");
  }

  const currentRegisteredCount = await prisma.eventRegistration.count({
    where: {
      eventId,
      status: RegistrationStatus.REGISTERED,
    },
  });

  const status = currentRegisteredCount >= event.capacity
    ? RegistrationStatus.WAITLISTED
    : RegistrationStatus.REGISTERED;

  return prisma.eventRegistration.create({
    data: {
      eventId,
      memberId: memberProfile.id,
      status,
    },
    include: {
      event: true,
      member: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};

export const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
};

