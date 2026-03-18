import { EventType, PaymentStatus, PaymentVerificationStatus, Prisma, RegistrationStatus, Role } from "@prisma/client";

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

export const registrationService = { getRegistrations, cancelRegistration };
