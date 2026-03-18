import { ContactMessageCategory, ContactMessageStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const buildMessageRow = (message: any) => ({
  id: message.id,
  senderName: message.senderName,
  senderEmail: message.senderEmail,
  senderPhone: message.senderPhone,
  subject: message.subject,
  category: message.category,
  message: message.message,
  status: message.status,
  adminNote: message.adminNote,
  reviewedAt: message.reviewedAt,
  resolvedAt: message.resolvedAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  user: message.user ? { id: message.user.id, name: message.user.name, email: message.user.email, role: message.user.role } : null,
  reviewer: message.reviewer ? { id: message.reviewer.id, name: message.reviewer.name, email: message.reviewer.email } : null,
});

const createContactMessage = async (userId: string, payload: { category: ContactMessageCategory; phone?: string; subject: string; message: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) throw new AppError(404, "User not found");

  const created = await prisma.contactMessage.create({
    data: {
      userId,
      senderName: user.name?.trim() || user.email,
      senderEmail: user.email,
      senderPhone: payload.phone?.trim() || user.phone?.trim() || null,
      category: payload.category,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  return buildMessageRow(created);
};

const getMyContactMessages = async (userId: string) => {
  const result = await prisma.contactMessage.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  return result.map(buildMessageRow);
};

const getAdminContactMessages = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm } = queryBuilder(query);
  const status = typeof query.status === "string" ? (query.status as ContactMessageStatus) : undefined;
  const category = typeof query.category === "string" ? (query.category as ContactMessageCategory) : undefined;

  const where: Prisma.ContactMessageWhereInput = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(searchTerm
      ? {
          OR: [
            { senderName: { contains: searchTerm, mode: "insensitive" } },
            { senderEmail: { contains: searchTerm, mode: "insensitive" } },
            { senderPhone: { contains: searchTerm, mode: "insensitive" } },
            { subject: { contains: searchTerm, mode: "insensitive" } },
            { message: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, result, summary] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.contactMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    meta: { page, limit, total },
    summary: {
      total,
      pending: summary.find((item) => item.status === ContactMessageStatus.PENDING)?._count._all ?? 0,
      inProgress: summary.find((item) => item.status === ContactMessageStatus.IN_PROGRESS)?._count._all ?? 0,
      resolved: summary.find((item) => item.status === ContactMessageStatus.RESOLVED)?._count._all ?? 0,
    },
    result: result.map(buildMessageRow),
  };
};

const reviewContactMessage = async (messageId: string, reviewerId: string, payload: { status: ContactMessageStatus; adminNote?: string }) => {
  const existing = await prisma.contactMessage.findUnique({ where: { id: messageId } });

  if (!existing) {
    throw new AppError(404, "Contact message not found");
  }

  const updated = await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      status: payload.status,
      adminNote: payload.adminNote?.trim() || null,
      reviewedAt: new Date(),
      resolvedAt: payload.status === ContactMessageStatus.RESOLVED ? new Date() : null,
      reviewer: { connect: { id: reviewerId } },
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  return buildMessageRow(updated);
};

export const contactService = {
  createContactMessage,
  getMyContactMessages,
  getAdminContactMessages,
  reviewContactMessage,
};
