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
const isManagementRole = (role: Role) => role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.EVENT_MANAGER;

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
    include: { memberProfile: true },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (isManagementRole(user.role)) {
    throw new AppError(403, "Administrative accounts cannot submit membership applications");
  }

  if (user.memberProfile) {
    throw new AppError(409, "Your account already has an active member profile");
  }

  const [existingUserApplication, existingStudentApplication] = await Promise.all([
    prisma.membershipApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
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
    }),
    prisma.membershipApplication.findUnique({
      where: { studentId: payload.studentId },
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
    }),
  ]);

  if (existingUserApplication && (existingUserApplication.status === ApplicationStatus.PENDING || existingUserApplication.status === ApplicationStatus.APPROVED)) {
    throw new AppError(409, "A membership application already exists for this user");
  }

  if (existingStudentApplication && existingStudentApplication.userId !== userId) {
    throw new AppError(409, "This student ID is already used in another membership application");
  }

  if (existingStudentApplication && (existingStudentApplication.status === ApplicationStatus.PENDING || existingStudentApplication.status === ApplicationStatus.APPROVED)) {
    throw new AppError(409, "A membership application already exists for this student ID");
  }

  const resubmittableApplication = existingUserApplication?.status === ApplicationStatus.REJECTED
    ? existingUserApplication
    : existingStudentApplication?.status === ApplicationStatus.REJECTED && existingStudentApplication.userId === userId
      ? existingStudentApplication
      : null;

  const application = resubmittableApplication
    ? await prisma.membershipApplication.update({
        where: { id: resubmittableApplication.id },
        data: {
          ...payload,
          status: ApplicationStatus.PENDING,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
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
      })
    : await prisma.membershipApplication.create({
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
    resubmittableApplication ? "Membership Application Resubmitted" : "Membership Application Received",
    "applicationReceived.ejs",
    { name: user.name },
  );

  return application;
};

const getApplications = async (userId: string, userRole: Role, query: Record<string, unknown>) => {
  const { skip, take, page, limit, searchTerm } = queryBuilder(query);
  const status = typeof query.status === "string" ? (query.status as ApplicationStatus) : undefined;

  const where =
    !isManagementRole(userRole)
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

  if (!isManagementRole(userRole) && application.userId !== userId) {
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
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.memberProfile.update({
        where: { userId: application.userId },
        data: { status: "ACTIVE" },
      });
    }

    await prisma.user.update({
      where: { id: application.userId },
      data: { role: Role.MEMBER },
    });

    await sendApplicationEmail(
      application.applicant.email,
      "Membership Application Approved",
      "applicationApproved.ejs",
      { name: application.applicant.name, membershipId },
    );
  }

  if (payload.status === ApplicationStatus.REJECTED) {
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: Role.USER },
    });

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
