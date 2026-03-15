import { NoticeAudience, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const getVisibleAudiences = (role: Role) => {
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return [NoticeAudience.ALL, NoticeAudience.MEMBERS, NoticeAudience.ADMINS];
  }

  return [NoticeAudience.ALL, NoticeAudience.MEMBERS];
};

const getNotices = async (role: Role, query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const audience = typeof query.audience === "string" ? query.audience as NoticeAudience : undefined;

  const allowedAudiences = getVisibleAudiences(role);

  const where = {
    audience: audience ? audience : { in: allowedAudiences },
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" as const } },
            { content: { contains: searchTerm, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.notice.count({ where }),
  ]);

  return { meta: { page, limit, total }, result: notices };
};

const getNoticeById = async (noticeId: string, role: Role) => {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!notice) {
    throw new AppError(404, "Notice not found");
  }

  if (!getVisibleAudiences(role).includes(notice.audience)) {
    throw new AppError(403, "Forbidden");
  }

  return notice;
};

const createNotice = async (userId: string, payload: { title: string; content: string; audience: NoticeAudience }) => {
  return prisma.notice.create({
    data: {
      title: payload.title,
      content: payload.content,
      audience: payload.audience,
      createdBy: userId,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

const updateNotice = async (noticeId: string, payload: Partial<{ title: string; content: string; audience: NoticeAudience }>) => {
  const existingNotice = await prisma.notice.findUnique({ where: { id: noticeId } });

  if (!existingNotice) {
    throw new AppError(404, "Notice not found");
  }

  return prisma.notice.update({
    where: { id: noticeId },
    data: payload,
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

const deleteNotice = async (noticeId: string) => {
  const existingNotice = await prisma.notice.findUnique({ where: { id: noticeId } });

  if (!existingNotice) {
    throw new AppError(404, "Notice not found");
  }

  await prisma.notice.delete({ where: { id: noticeId } });
};

export const noticeService = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
};

