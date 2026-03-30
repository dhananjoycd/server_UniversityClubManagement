import { EventType, PaymentStatus, PaymentVerificationStatus, Prisma, RegistrationStatus, Role } from "@prisma/client";

import { stripeClient } from "../../config/stripe";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const isPrivilegedRole = (role: Role) =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.EVENT_MANAGER;

type RegistrationWithEvent = Prisma.EventRegistrationGetPayload<{
  include: {
    event: true;
    user: { select: { id: true; name: true; email: true } };
    member: { include: { user: { select: { id: true; name: true; email: true } } } };
  };
}>;

const normalizeRegistrationPaymentState = (registration: RegistrationWithEvent) => {
  const isPaidEvent = registration.event?.eventType === EventType.PAID;

  if (!isPaidEvent) {
    return {
      ...registration,
      paymentStatus: registration.paymentStatus ?? PaymentStatus.NOT_REQUIRED,
      paymentVerificationStatus:
        registration.paymentVerificationStatus ?? PaymentVerificationStatus.NOT_APPLICABLE,
    };
  }

  if (registration.paymentStatus && registration.paymentVerificationStatus) {
    return registration;
  }

  if (registration.paymentVerifiedAt) {
    return {
      ...registration,
      paymentStatus: registration.paymentStatus ?? PaymentStatus.PAID,
      paymentVerificationStatus:
        registration.paymentVerificationStatus ?? PaymentVerificationStatus.VERIFIED,
    };
  }

  if (registration.stripeCheckoutSessionId) {
    return {
      ...registration,
      paymentStatus: registration.paymentStatus ?? PaymentStatus.PENDING,
      paymentVerificationStatus:
        registration.paymentVerificationStatus ??
        PaymentVerificationStatus.PENDING_VERIFICATION,
    };
  }

  return {
    ...registration,
    paymentStatus: registration.paymentStatus ?? PaymentStatus.FAILED,
    paymentVerificationStatus:
      registration.paymentVerificationStatus ?? PaymentVerificationStatus.FAILED,
  };
};

const getRegistrations = async (userId: string, userRole: Role, query: Record<string, unknown>) => {
  const { skip, take, page, limit } = queryBuilder(query);
  const where = isPrivilegedRole(userRole) ? {} : { userId };

  const [registrations, total] = await Promise.all([
    prisma.eventRegistration.findMany({
      where,
      skip,
      take,
      orderBy: { registeredAt: "desc" },
      include: {
        event: true,
        user: { select: { id: true, name: true, email: true } },
        member: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.eventRegistration.count({ where }),
  ]);

  return {
    meta: { page, limit, total },
    result: registrations.map(normalizeRegistrationPaymentState),
  };
};

const verifyPendingPayment = async (registrationId: string, _userId: string, userRole: Role) => {
  if (!isPrivilegedRole(userRole)) throw new AppError(403, "Forbidden");

  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!registration) throw new AppError(404, "Registration not found");
  if (registration.event.eventType !== EventType.PAID) throw new AppError(400, "Only paid event registrations can be verified");
  if (registration.paymentVerificationStatus === PaymentVerificationStatus.VERIFIED) {
    return normalizeRegistrationPaymentState(registration);
  }
  if (!registration.stripeCheckoutSessionId) throw new AppError(400, "No Stripe checkout reference was found for this registration");
  if (!stripeClient) throw new AppError(500, "Stripe is not configured for manual verification");

  const checkoutSession = await stripeClient.checkout.sessions.retrieve(registration.stripeCheckoutSessionId);
  if (checkoutSession.payment_status !== "paid") {
    throw new AppError(409, "Stripe has not marked this checkout session as paid yet");
  }

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentVerificationStatus: PaymentVerificationStatus.VERIFIED,
      paymentVerifiedAt: new Date(),
      stripeCheckoutSessionId: checkoutSession.id,
      paidAmount:
        typeof checkoutSession.amount_total === "number"
          ? checkoutSession.amount_total / 100
          : registration.paidAmount,
      paidCurrency:
        checkoutSession.currency?.toUpperCase() ?? registration.paidCurrency ?? registration.event.currency ?? "BDT",
      status: registration.status === RegistrationStatus.CANCELLED ? RegistrationStatus.REGISTERED : registration.status,
    },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return normalizeRegistrationPaymentState(updatedRegistration);
};

const cancelRegistration = async (registrationId: string, userId: string, userRole: Role) => {
  const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) throw new AppError(404, "Registration not found");

  const isOwner = registration.userId === userId;
  if (!isPrivilegedRole(userRole) && !isOwner) throw new AppError(403, "Forbidden");

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: RegistrationStatus.CANCELLED },
    include: {
      event: true,
      user: { select: { id: true, name: true, email: true } },
      member: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return normalizeRegistrationPaymentState(updatedRegistration);
};

export const registrationService = { getRegistrations, verifyPendingPayment, cancelRegistration };
