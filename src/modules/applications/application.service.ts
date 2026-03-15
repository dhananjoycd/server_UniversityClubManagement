import { ApplicationStatus, Role } from "@prisma/client";
import { renderFile } from "ejs";
import { resolve } from "node:path";

import { isMailConfigured, mailTransporter } from "../../config/nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const renderTemplate = async (templateName: string, data: Record<string, unknown>) => {
  return renderFile(resolve(process.cwd(), "src", "templates", templateName), data);
};

const sendApplicationEmail = async (
  email: string,
  subject: string,
  templateName: string,
  data: Record<string, unknown>,
) => {
  if (!isMailConfigured || !mailTransporter) {
    return;
  }

  const html = await renderTemplate(templateName, data);

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    html,
  });
};

const generateMembershipId = () => `MEM-${Date.now()}`;

const createApplication = async (
  userId: string,
  payload: {
    department: string;
    session: string;
    studentId: string;
    district: string;
    phone: string;
  },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const existingApplication = await prisma.membershipApplication.findFirst({
    where: {
      OR: [
        { userId, status: ApplicationStatus.PENDING },
        { userId, status: ApplicationStatus.APPROVED },
        { studentId: payload.studentId },
      ],
    },
  });

  if (existingApplication) {
    throw new AppError(409, "A membership application already exists for this user or student ID");
  }

  const application = await prisma.membershipApplication.create({
    data: {
      userId,
      ...payload,
    },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  await sendApplicationEmail(
    user.email,
    "Membership Application Received",
    "applicationReceived.ejs",
    { name: user.name },
  );

  return application;
};

const getApplications = async (userId: string, userRole: Role, query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const status = typeof query.status === "string" ? (query.status as ApplicationStatus) : undefined;

  const where =
    userRole === Role.MEMBER
      ? { userId }
      : {
          ...(status ? { status } : {}),
          ...(searchTerm
            ? {
                OR: [
                  { district: { contains: searchTerm, mode: "insensitive" as const } },
                  { studentId: { contains: searchTerm, mode: "insensitive" as const } },
                  { applicant: { name: { contains: searchTerm, mode: "insensitive" as const } } },
                  { applicant: { email: { contains: searchTerm, mode: "insensitive" as const } } },
                ],
              }
            : {}),
        };

  const [applications, total] = await Promise.all([
    prisma.membershipApplication.findMany({
      where,
      skip,
      take,
      orderBy: { submittedAt: "desc" },
      include: {
        applicant: {
          select: { id: true, name: true, email: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.membershipApplication.count({ where }),
  ]);

  return {
    meta: { page, limit, total },
    result: applications,
  };
};

const getApplicationById = async (applicationId: string, userId: string, userRole: Role) => {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        select: { id: true, name: true, email: true, role: true },
      },
      reviewer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (userRole === Role.MEMBER && application.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  return application;
};

const reviewApplication = async (
  applicationId: string,
  reviewerId: string,
  payload: { status: "APPROVED" | "REJECTED"; reason?: string },
) => {
  const application = await prisma.membershipApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: true,
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new AppError(409, "Only pending applications can be reviewed");
  }

  const updatedApplication = await prisma.membershipApplication.update({
    where: { id: applicationId },
    data: {
      status: payload.status,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    },
    include: {
      applicant: true,
      reviewer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (payload.status === ApplicationStatus.APPROVED) {
    const existingProfile = await prisma.memberProfile.findUnique({
      where: { userId: application.userId },
    });

    const membershipId = existingProfile?.membershipId ?? generateMembershipId();

    if (!existingProfile) {
      await prisma.memberProfile.create({
        data: {
          userId: application.userId,
          membershipId,
        },
      });
    }

    await sendApplicationEmail(
      application.applicant.email,
      "Membership Application Approved",
      "applicationApproved.ejs",
      { name: application.applicant.name, membershipId },
    );
  }

  if (payload.status === ApplicationStatus.REJECTED) {
    await sendApplicationEmail(
      application.applicant.email,
      "Membership Application Rejected",
      "applicationRejected.ejs",
      { name: application.applicant.name, reason: payload.reason ?? "No reason provided" },
    );
  }

  return updatedApplication;
};

export const applicationService = {
  createApplication,
  getApplications,
  getApplicationById,
  reviewApplication,
};
