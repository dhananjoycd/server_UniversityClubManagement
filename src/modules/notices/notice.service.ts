import { ApplicationStatus, NoticeAudience, Prisma, Role } from "@prisma/client";

import { isMailConfigured, mailTransporter } from "../../config/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const isApplicantUser = async (userId: string) => {
  const latestApplication = await prisma.membershipApplication.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    select: { status: true },
  });

  return Boolean(
    latestApplication &&
      (latestApplication.status === ApplicationStatus.PENDING ||
        latestApplication.status === ApplicationStatus.REJECTED),
  );
};

const getVisibleAudiences = async (user: { id: string; role: Role }) => {
  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    return Object.values(NoticeAudience);
  }

  const audiences: NoticeAudience[] = [NoticeAudience.ALL];

  if (user.role === Role.EVENT_MANAGER) {
    audiences.push(NoticeAudience.EVENT_MANAGERS);
  }

  if (user.role === Role.MEMBER) {
    audiences.push(NoticeAudience.MEMBERS);
  }

  if (user.role === Role.USER) {
    const applicant = await isApplicantUser(user.id);
    audiences.push(applicant ? NoticeAudience.APPLICANTS : NoticeAudience.USERS);
  }

  return audiences;
};

const getAudienceRecipientEmails = async (audience: NoticeAudience) => {
  if (audience === NoticeAudience.ALL) {
    const users = await prisma.user.findMany({
      select: { email: true },
    });
    return users.map((user) => user.email);
  }

  if (audience === NoticeAudience.USERS) {
    const users = await prisma.user.findMany({
      where: {
        role: Role.USER,
        membershipApplications: {
          none: {},
        },
      },
      select: { email: true },
    });
    return users.map((user) => user.email);
  }

  if (audience === NoticeAudience.APPLICANTS) {
    const applications = await prisma.membershipApplication.findMany({
      where: {
        status: {
          in: [ApplicationStatus.PENDING, ApplicationStatus.REJECTED],
        },
        applicant: {
          role: Role.USER,
        },
      },
      orderBy: { submittedAt: "desc" },
      distinct: ["userId"],
      select: {
        applicant: {
          select: { email: true },
        },
      },
    });

    return applications.map((entry) => entry.applicant.email);
  }

  if (audience === NoticeAudience.MEMBERS) {
    const users = await prisma.user.findMany({
      where: { role: Role.MEMBER },
      select: { email: true },
    });
    return users.map((user) => user.email);
  }

  if (audience === NoticeAudience.EVENT_MANAGERS) {
    const users = await prisma.user.findMany({
      where: { role: Role.EVENT_MANAGER },
      select: { email: true },
    });
    return users.map((user) => user.email);
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
    },
    select: { email: true },
  });
  return users.map((user) => user.email);
};

const sendNoticeAudienceEmail = async (
  notice: { title: string; content: string; audience: NoticeAudience; createdAt: Date; updatedAt: Date },
  options: { edited?: boolean } = {},
) => {
  if (!isMailConfigured || !mailTransporter) {
    return;
  }

  const emails = [...new Set((await getAudienceRecipientEmails(notice.audience)).filter(Boolean))];

  if (!emails.length) {
    return;
  }

  const formattedCreatedAt = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(notice.createdAt);

  const formattedUpdatedAt = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(notice.updatedAt);

  const subjectPrefix = options.edited ? "Updated notice" : "New notice";
  const subject = `${subjectPrefix}: ${notice.title}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">${notice.title}</h2>
      <p style="margin: 0 0 12px; color: #475569;">Audience: ${notice.audience}</p>
      <p style="margin: 0 0 16px; white-space: pre-line;">${notice.content}</p>
      <p style="margin: 0; font-size: 13px; color: #64748b;">Published: ${formattedCreatedAt}</p>
      ${options.edited ? `<p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Last updated: ${formattedUpdatedAt}</p>` : ""}
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

const getNotices = async (user: { id: string; role: Role }, query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const audience =
    typeof query.audience === "string" ? (query.audience as NoticeAudience) : undefined;

  const allowedAudiences = await getVisibleAudiences(user);

  if (audience && !allowedAudiences.includes(audience)) {
    throw new AppError(403, "Forbidden");
  }

  const where: Prisma.NoticeWhereInput = {
    audience: audience ? audience : { in: allowedAudiences },
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
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

const getNoticeById = async (noticeId: string, user: { id: string; role: Role }) => {
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

  const visibleAudiences = await getVisibleAudiences(user);
  if (!visibleAudiences.includes(notice.audience)) {
    throw new AppError(403, "Forbidden");
  }

  return notice;
};

const createNotice = async (
  userId: string,
  payload: { title: string; content: string; audience: NoticeAudience; sendEmail?: boolean },
) => {
  const notice = await prisma.notice.create({
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

  if (payload.sendEmail) {
    try {
      await sendNoticeAudienceEmail(notice);
    } catch (error) {
      console.error("Notice email delivery failed", error);
    }
  }

  return notice;
};

const updateNotice = async (
  noticeId: string,
  payload: Partial<{ title: string; content: string; audience: NoticeAudience; sendEmail?: boolean }>,
) => {
  const existingNotice = await prisma.notice.findUnique({ where: { id: noticeId } });

  if (!existingNotice) {
    throw new AppError(404, "Notice not found");
  }

  const notice = await prisma.notice.update({
    where: { id: noticeId },
    data: {
      title: payload.title,
      content: payload.content,
      audience: payload.audience,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (payload.sendEmail) {
    try {
      await sendNoticeAudienceEmail(notice, { edited: true });
    } catch (error) {
      console.error("Notice email delivery failed", error);
    }
  }

  return notice;
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
