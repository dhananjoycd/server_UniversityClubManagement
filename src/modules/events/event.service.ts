import {
  EventType,
  MemberStatus,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
  Role,
} from "@prisma/client";
import Stripe from "stripe";

import { env } from "../../config/env";
import { isMailConfigured, mailTransporter } from "../../config/nodemailer";
import { stripeClient } from "../../config/stripe";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const PAYMENT_VERIFICATION_STATUS = {
  NOT_APPLICABLE: "NOT_APPLICABLE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
} as const;

type PaymentVerificationStatusValue =
  (typeof PAYMENT_VERIFICATION_STATUS)[keyof typeof PAYMENT_VERIFICATION_STATUS];

type RegistrationWithVerification = {
  id: string;
  eventId: string;
  userId: string;
  memberId?: string | null;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentVerificationStatus?: PaymentVerificationStatusValue;
  stripeCheckoutSessionId?: string | null;
};

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

const getEventAudienceEmails = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.USER, Role.MEMBER] },
    },
    select: { email: true },
  });

  return [...new Set(users.map((user) => user.email).filter(Boolean))];
};

const sendEventAudienceEmail = async (
  event: { title: string; description: string; location: string; eventDate: Date; category?: string | null; eventType: EventType; price?: number | null; currency?: string | null; },
  options: { edited?: boolean } = {},
) => {
  if (!isMailConfigured || !mailTransporter) {
    return;
  }

  const emails = await getEventAudienceEmails();
  if (!emails.length) {
    return;
  }

  const formattedEventDate = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(event.eventDate);

  const subject = `${options.edited ? "Updated event" : "New event"}: ${event.title}`;
  const pricingLine =
    event.eventType === EventType.PAID
      ? `${event.price ?? 0} ${(event.currency ?? "bdt").toUpperCase()}`
      : "Free";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">${event.title}</h2>
      <p style="margin: 0 0 10px; color: #475569;">${event.category ?? "Club event"}</p>
      <p style="margin: 0 0 10px; white-space: pre-line;">${event.description}</p>
      <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Date:</strong> ${formattedEventDate}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #334155;"><strong>Location:</strong> ${event.location}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #334155;"><strong>Type:</strong> ${pricingLine}</p>
      ${options.edited ? '<p style="margin: 14px 0 0; font-size: 13px; color: #b45309;">This event was updated after publication.</p>' : ''}
    </div>
  `;

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_FROM,
    bcc: emails,
    subject,
    html,
  });
};

const countConfirmedRegistrations = async (eventId: string) =>
  prisma.eventRegistration.count({
    where: ({
      eventId,
      status: RegistrationStatus.REGISTERED,
      paymentVerificationStatus: {
        in: [PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE, PAYMENT_VERIFICATION_STATUS.VERIFIED],
      },
    } as any),
  });

const resolveRegistrationStatus = async (eventId: string, capacity: number) => {
  const currentRegisteredCount = await countConfirmedRegistrations(eventId);
  return currentRegisteredCount >= capacity ? RegistrationStatus.WAITLISTED : RegistrationStatus.REGISTERED;
};

const createRegistrationRecord = async ({
  eventId,
  userId,
  memberId,
  capacity,
  paymentStatus,
  paymentVerificationStatus,
  paidAmount,
  paidCurrency,
  stripeCheckoutSessionId,
  paymentVerifiedAt,
  snapshot,
}: {
  eventId: string;
  userId: string;
  memberId?: string | null;
  capacity: number;
  paymentStatus: PaymentStatus;
  paymentVerificationStatus: PaymentVerificationStatusValue;
  paidAmount?: number;
  paidCurrency?: string;
  stripeCheckoutSessionId?: string;
  paymentVerifiedAt?: Date;
  snapshot: ReturnType<typeof buildSnapshot>;
}) => {
  const status = await resolveRegistrationStatus(eventId, capacity);

  return prisma.eventRegistration.create({
    data: ({
      eventId,
      userId,
      memberId,
      status,
      paymentStatus,
      paymentVerificationStatus,
      paidAmount,
      paidCurrency,
      stripeCheckoutSessionId,
      paymentVerifiedAt,
      ...snapshot,
    } as any),
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const updateRegistrationRecord = async ({
  registrationId,
  eventId,
  memberId,
  capacity,
  paymentStatus,
  paymentVerificationStatus,
  paidAmount,
  paidCurrency,
  stripeCheckoutSessionId,
  paymentVerifiedAt,
  snapshot,
}: {
  registrationId: string;
  eventId: string;
  memberId?: string | null;
  capacity: number;
  paymentStatus: PaymentStatus;
  paymentVerificationStatus: PaymentVerificationStatusValue;
  paidAmount?: number | null;
  paidCurrency?: string | null;
  stripeCheckoutSessionId?: string | null;
  paymentVerifiedAt?: Date | null;
  snapshot: ReturnType<typeof buildSnapshot>;
}) => {
  const status = await resolveRegistrationStatus(eventId, capacity);

  return prisma.eventRegistration.update({
    where: { id: registrationId },
    data: ({
      memberId,
      status,
      paymentStatus,
      paymentVerificationStatus,
      paidAmount: paidAmount ?? null,
      paidCurrency: paidCurrency ?? null,
      stripeCheckoutSessionId: stripeCheckoutSessionId ?? null,
      paymentVerifiedAt: paymentVerifiedAt ?? null,
      ...snapshot,
    } as any),
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
        registrations: {
          where: {
            status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED] },
            paymentVerificationStatus: {
              in: [PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE, PAYMENT_VERIFICATION_STATUS.VERIFIED],
            },
          },
          select: { id: true, status: true, paymentStatus: true, paymentVerificationStatus: true },
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
      creator: { select: { id: true, name: true, email: true, role: true } },
      registrations: {
        where: {
          status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED] },
          paymentVerificationStatus: {
            in: [PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE, PAYMENT_VERIFICATION_STATUS.VERIFIED],
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          member: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });

  if (!event) throw new AppError(404, "Event not found");
  return event;
};

const createEvent = async (
  userId: string,
  payload: {
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
    sendEmail?: boolean;
  },
) => {
  const event = await prisma.$transaction(async (tx) => {
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
        currency: payload.eventType === EventType.PAID ? "bdt" : null,
        imageUrl: payload.imageUrl,
        isFeatured: payload.isFeatured ?? false,
        isRegistrationOpen: payload.isRegistrationOpen ?? true,
        createdBy: userId,
      },
    });
  });

  if (payload.sendEmail) {
    try {
      await sendEventAudienceEmail(event);
    } catch (error) {
      console.error("Event email delivery failed", error);
    }
  }

  return event;
};

const updateEvent = async (
  eventId: string,
  payload: Partial<{
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
    sendEmail?: boolean;
  }>,
) => {
  const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existingEvent) throw new AppError(404, "Event not found");
  const effectiveEventType = payload.eventType ?? existingEvent.eventType;

  const event = await prisma.$transaction(async (tx) => {
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
        ...(payload.price !== undefined || payload.eventType !== undefined
          ? {
              price:
                effectiveEventType === EventType.PAID
                  ? (payload.price ?? existingEvent.price)
                  : null,
            }
          : {}),
        ...(payload.currency !== undefined || payload.eventType !== undefined
          ? {
              currency: effectiveEventType === EventType.PAID ? "bdt" : null,
            }
          : {}),
        ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl || null } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
        ...(payload.isRegistrationOpen !== undefined
          ? { isRegistrationOpen: payload.isRegistrationOpen }
          : {}),
      },
    });
  });

  if (payload.sendEmail) {
    try {
      await sendEventAudienceEmail(event, { edited: true });
    } catch (error) {
      console.error("Event email delivery failed", error);
    }
  }

  return event;
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

  const [event, memberProfile, user, existingRegistration] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.memberProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId } } }),
  ]);

  if (!event) throw new AppError(404, "Event not found");
  if (!user) throw new AppError(404, "User not found");
  if (!event.isRegistrationOpen || event.eventDate < new Date())
    throw new AppError(400, "Registration is closed for this event");
  if (memberProfile && memberProfile.status !== MemberStatus.ACTIVE)
    throw new AppError(403, "Only active members can register through a member profile");

  const missingFields = getProfileMissingFields(user);
  if (missingFields.length > 0)
    throw new AppError(
      400,
      `Complete your profile before registering. Missing: ${missingFields.join(", ")}`,
    );

  if (
    existingRegistration &&
    existingRegistration.status !== RegistrationStatus.CANCELLED &&
    existingRegistration.paymentVerificationStatus === PAYMENT_VERIFICATION_STATUS.PENDING_VERIFICATION
  ) {
    throw new AppError(409, "Payment verification is already in progress for this event");
  }

  if (
    existingRegistration &&
    existingRegistration.status !== RegistrationStatus.CANCELLED &&
    (existingRegistration.paymentVerificationStatus === PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE ||
      existingRegistration.paymentVerificationStatus === PAYMENT_VERIFICATION_STATUS.VERIFIED)
  ) {
    throw new AppError(409, "You are already registered for this event");
  }

  const snapshot = buildSnapshot(user);

  if (event.eventType === EventType.PAID && event.price && event.price > 0) {
    if (!stripeClient) throw new AppError(500, "Stripe is not configured for paid event checkout");

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${env.CLIENT_URL}/events/${event.id}?payment=success`,
      cancel_url: `${env.CLIENT_URL}/events/${event.id}?payment=cancelled`,
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: { name: event.title, description: event.description },
            unit_amount: Math.round(event.price * 100),
          },
          quantity: 1,
        },
      ],
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

    if (existingRegistration) {
      await updateRegistrationRecord({
        registrationId: existingRegistration.id,
        eventId: event.id,
        memberId: memberProfile?.id,
        capacity: event.capacity,
        paymentStatus: PaymentStatus.PENDING,
        paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.PENDING_VERIFICATION,
        paidAmount: null,
        paidCurrency: event.currency ?? "bdt",
        stripeCheckoutSessionId: session.id,
        paymentVerifiedAt: null,
        snapshot,
      });
    } else {
      await createRegistrationRecord({
        eventId: event.id,
        userId,
        memberId: memberProfile?.id,
        capacity: event.capacity,
        paymentStatus: PaymentStatus.PENDING,
        paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.PENDING_VERIFICATION,
        paidCurrency: event.currency ?? "bdt",
        stripeCheckoutSessionId: session.id,
        snapshot,
      });
    }

    return { requiresPayment: true, checkoutUrl: session.url, registration: null };
  }

  const registration = existingRegistration
    ? await updateRegistrationRecord({
        registrationId: existingRegistration.id,
        eventId: event.id,
        memberId: memberProfile?.id,
        capacity: event.capacity,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
        paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE,
        paidAmount: null,
        paidCurrency: null,
        stripeCheckoutSessionId: null,
        paymentVerifiedAt: null,
        snapshot,
      })
    : await createRegistrationRecord({
        eventId: event.id,
        userId,
        memberId: memberProfile?.id,
        capacity: event.capacity,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
        paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.NOT_APPLICABLE,
        snapshot,
      });

  return { requiresPayment: false, checkoutUrl: null, registration };
};

const markPaymentVerificationFailed = async (eventId: string, userId: string) => {
  const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId } } });

  if (!registration || registration.paymentVerificationStatus !== PAYMENT_VERIFICATION_STATUS.PENDING_VERIFICATION) {
    return null;
  }

  return prisma.eventRegistration.update({
    where: { id: registration.id },
    data: {
      status: RegistrationStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.FAILED,
      paymentVerifiedAt: null,
    },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
};

const completePaidRegistration = async (session: Stripe.Checkout.Session) => {
  const eventId = session.metadata?.eventId;
  const userId = session.metadata?.userId;
  if (!eventId || !userId) return null;

  const existingRegistrationBySession = await prisma.eventRegistration.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  const existingRegistrationByUser = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  const existingRegistration = existingRegistrationBySession ?? existingRegistrationByUser;

  if (existingRegistration?.paymentVerificationStatus === PAYMENT_VERIFICATION_STATUS.VERIFIED) {
    return existingRegistration;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "Event not found for payment completion");

  const snapshot = {
    snapshotName: session.metadata?.snapshotName ?? "",
    snapshotEmail: session.metadata?.snapshotEmail ?? "",
    snapshotPhone: session.metadata?.snapshotPhone ?? "",
    snapshotSession: session.metadata?.snapshotSession ?? "",
    snapshotDepartment: session.metadata?.snapshotDepartment ?? "",
  };

  if (existingRegistration) {
    return updateRegistrationRecord({
      registrationId: existingRegistration.id,
      eventId,
      memberId: session.metadata?.memberId || null,
      capacity: event.capacity,
      paymentStatus: PaymentStatus.PAID,
      paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.VERIFIED,
      paidAmount: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
      paidCurrency: "bdt",
      stripeCheckoutSessionId: session.id,
      paymentVerifiedAt: new Date(),
      snapshot,
    });
  }

  return createRegistrationRecord({
    eventId,
    userId,
    memberId: session.metadata?.memberId || null,
    capacity: event.capacity,
    paymentStatus: PaymentStatus.PAID,
    paymentVerificationStatus: PAYMENT_VERIFICATION_STATUS.VERIFIED,
    paidAmount: typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
    paidCurrency: "bdt",
    stripeCheckoutSessionId: session.id,
    paymentVerifiedAt: new Date(),
    snapshot,
  });
};

export const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  markPaymentVerificationFailed,
  completePaidRegistration,
};
