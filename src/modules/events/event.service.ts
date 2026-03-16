import { EventType, MemberStatus, PaymentStatus, Prisma, RegistrationStatus, Role } from "@prisma/client";
import Stripe from "stripe";

import { env } from "../../config/env";
import { stripeClient } from "../../config/stripe";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const getProfileMissingFields = (user: {
  name?: string | null;
  email: string;
  phone?: string | null;
  academicSession?: string | null;
  department?: string | null;
}) => {
  const missing: string[] = [];
  if (!user.name?.trim()) missing.push("name");
  if (!user.email?.trim()) missing.push("email");
  if (!user.phone?.trim()) missing.push("phone");
  if (!user.academicSession?.trim()) missing.push("session");
  if (!user.department?.trim()) missing.push("department");
  return missing;
};

const buildSnapshot = (user: {
  name?: string | null;
  email: string;
  phone?: string | null;
  academicSession?: string | null;
  department?: string | null;
}) => ({
  snapshotName: user.name?.trim() || "",
  snapshotEmail: user.email,
  snapshotPhone: user.phone?.trim() || "",
  snapshotSession: user.academicSession?.trim() || "",
  snapshotDepartment: user.department?.trim() || "",
});

const createRegistrationRecord = async ({
  eventId,
  userId,
  memberId,
  capacity,
  paymentStatus,
  paidAmount,
  paidCurrency,
  stripeCheckoutSessionId,
  snapshot,
}: {
  eventId: string;
  userId: string;
  memberId?: string | null;
  capacity: number;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  paidCurrency?: string;
  stripeCheckoutSessionId?: string;
  snapshot: ReturnType<typeof buildSnapshot>;
}) => {
  const currentRegisteredCount = await prisma.eventRegistration.count({ where: { eventId, status: RegistrationStatus.REGISTERED } });
  const status = currentRegisteredCount >= capacity ? RegistrationStatus.WAITLISTED : RegistrationStatus.REGISTERED;

  return prisma.eventRegistration.create({
    data: {
      eventId,
      userId,
      memberId,
      status,
      paymentStatus,
      paidAmount,
      paidCurrency,
      stripeCheckoutSessionId,
      ...snapshot,
    },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const getEvents = async (query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const upcomingOnly = query.upcomingOnly === true || query.upcomingOnly === "true";
  const featuredOnly = query.featuredOnly === true || query.featuredOnly === "true";
  const category = typeof query.category === "string" ? query.category.trim() : undefined;

  const where: Prisma.EventWhereInput = {
    ...(upcomingOnly ? { eventDate: { gte: new Date() } } : {}),
    ...(featuredOnly ? { isFeatured: true } : {}),
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" as const } },
            { location: { contains: searchTerm, mode: "insensitive" as const } },
            { category: { contains: searchTerm, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: [{ isFeatured: "desc" }, { eventDate: "asc" }],
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { registrations: true } },
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
      creator: { select: { id: true, name: true, email: true, role: true } },
      registrations: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          member: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) throw new AppError(404, "Event not found");
  return event;
};

const createEvent = async (userId: string, payload: {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
  category?: string;
  eventType?: EventType;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isRegistrationOpen?: boolean;
}) => {
  return prisma.$transaction(async (tx) => {
    if (payload.isFeatured) await tx.event.updateMany({ data: { isFeatured: false } });

    return tx.event.create({
      data: {
        title: payload.title,
        description: payload.description,
        location: payload.location,
        eventDate: new Date(payload.eventDate),
        capacity: payload.capacity,
        category: payload.category,
        eventType: payload.eventType ?? EventType.FREE,
        price: payload.eventType === EventType.PAID ? payload.price : null,
        currency: payload.eventType === EventType.PAID ? (payload.currency?.toLowerCase() || "usd") : null,
        imageUrl: payload.imageUrl,
        isFeatured: payload.isFeatured ?? false,
        isRegistrationOpen: payload.isRegistrationOpen ?? true,
        createdBy: userId,
      },
    });
  });
};

const updateEvent = async (eventId: string, payload: Partial<{
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
  category?: string;
  eventType: EventType;
  price?: number;
  currency?: string;
  imageUrl?: string;
  isFeatured: boolean;
  isRegistrationOpen: boolean;
}>) => {
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existingEvent) throw new AppError(404, "Event not found");
  const effectiveEventType = payload.eventType ?? existingEvent.eventType;

  return prisma.$transaction(async (tx) => {
    if (payload.isFeatured === true) {
      await tx.event.updateMany({ where: { id: { not: eventId } }, data: { isFeatured: false } });
    }

    return tx.event.update({
      where: { id: eventId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.location !== undefined ? { location: payload.location } : {}),
        ...(payload.eventDate !== undefined ? { eventDate: new Date(payload.eventDate) } : {}),
        ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
        ...(payload.category !== undefined ? { category: payload.category || null } : {}),
        ...(payload.eventType !== undefined ? { eventType: payload.eventType } : {}),
        ...(payload.price !== undefined || payload.eventType !== undefined ? { price: effectiveEventType === EventType.PAID ? payload.price ?? existingEvent.price : null } : {}),
        ...(payload.currency !== undefined || payload.eventType !== undefined ? { currency: effectiveEventType === EventType.PAID ? (payload.currency ?? existingEvent.currency ?? "usd").toLowerCase() : null } : {}),
        ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl || null } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
        ...(payload.isRegistrationOpen !== undefined ? { isRegistrationOpen: payload.isRegistrationOpen } : {}),
      },
    });
  });
};

const deleteEvent = async (eventId: string) => {
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existingEvent) throw new AppError(404, "Event not found");
  await prisma.event.delete({ where: { id: eventId } });
};

const registerForEvent = async (eventId: string, userId: string, userRole: Role) => {
  if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN || userRole === Role.EVENT_MANAGER) {
    throw new AppError(403, "Admin accounts cannot register for events");
  }

  const [event, memberProfile, user] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.memberProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!event) throw new AppError(404, "Event not found");
  if (!user) throw new AppError(404, "User not found");
  if (!event.isRegistrationOpen || event.eventDate < new Date()) throw new AppError(400, "Registration is closed for this event");
  if (memberProfile && memberProfile.status !== MemberStatus.ACTIVE) throw new AppError(403, "Only active members can register through a member profile");

  const missingFields = getProfileMissingFields(user);
  if (missingFields.length > 0) throw new AppError(400, `Complete your profile before registering. Missing: ${missingFields.join(", ")}`);

  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: { eventId, userId, status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED] } },
  });
  if (existingRegistration) throw new AppError(409, "You are already registered for this event");

  const snapshot = buildSnapshot(user);

  if (event.eventType === EventType.PAID && event.price && event.price > 0) {
    if (!stripeClient) throw new AppError(500, "Stripe is not configured for paid event checkout");

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${env.CLIENT_URL}/events/${event.id}?payment=success`,
      cancel_url: `${env.CLIENT_URL}/events/${event.id}?payment=cancelled`,
      line_items: [{
        price_data: {
          currency: (event.currency || "usd").toLowerCase(),
          product_data: { name: event.title, description: event.description },
          unit_amount: Math.round(event.price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        eventId: event.id,
        userId,
        memberId: memberProfile?.id ?? "",
        snapshotName: snapshot.snapshotName,
        snapshotEmail: snapshot.snapshotEmail,
        snapshotPhone: snapshot.snapshotPhone,
        snapshotSession: snapshot.snapshotSession,
        snapshotDepartment: snapshot.snapshotDepartment,
      },
    });

    return { requiresPayment: true, checkoutUrl: session.url, registration: null };
  }

  const registration = await createRegistrationRecord({
    eventId: event.id,
    userId,
    memberId: memberProfile?.id,
    capacity: event.capacity,
    paymentStatus: PaymentStatus.NOT_REQUIRED,
    snapshot,
  });

  return { requiresPayment: false, checkoutUrl: null, registration };
};

const completePaidRegistration = async (session: Stripe.Checkout.Session) => {
  const eventId = session.metadata?.eventId;
  const userId = session.metadata?.userId;
  if (!eventId || !userId) return null;

  const existingRegistration = await prisma.eventRegistration.findFirst({ where: { eventId, userId, status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED] } } });
  if (existingRegistration) return existingRegistration;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "Event not found for payment completion");

  return createRegistrationRecord({
    eventId,
    userId,
    memberId: session.metadata?.memberId || null,
    capacity: event.capacity,
    paymentStatus: PaymentStatus.PAID,
    paidAmount: typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
    paidCurrency: session.currency ?? undefined,
    stripeCheckoutSessionId: session.id,
    snapshot: {
      snapshotName: session.metadata?.snapshotName ?? "",
      snapshotEmail: session.metadata?.snapshotEmail ?? "",
      snapshotPhone: session.metadata?.snapshotPhone ?? "",
      snapshotSession: session.metadata?.snapshotSession ?? "",
      snapshotDepartment: session.metadata?.snapshotDepartment ?? "",
    },
  });
};

export const eventService = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerForEvent, completePaidRegistration };
