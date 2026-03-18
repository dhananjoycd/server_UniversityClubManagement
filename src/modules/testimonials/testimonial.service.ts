import { Prisma, TestimonialStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import queryBuilder from "../../utils/queryBuilder";

const requiredProfileFields = ["name", "email", "phone", "academicSession", "department", "studentId"] as const;

const getMissingProfileFields = (user: {
  name: string | null;
  email: string;
  phone: string | null;
  academicSession: string | null;
  department: string | null;
  studentId: string | null;
}) => requiredProfileFields.filter((field) => !user[field]?.toString().trim());

const getPublicTestimonials = async () => {
  const testimonials = await prisma.testimonial.findMany({
    where: { status: TestimonialStatus.APPROVED },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { reviewedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      authorName: true,
      quote: true,
      meta: true,
      isFeatured: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return testimonials;
};

const createTestimonial = async (userId: string, payload: { quote: string; meta: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      academicSession: true,
      department: true,
      studentId: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");

  const missingFields = getMissingProfileFields(user);
  if (missingFields.length > 0) {
    throw new AppError(400, `Complete your profile before sending a testimonial. Missing: ${missingFields.join(", ")}`);
  }

  const pendingSubmission = await prisma.testimonial.findFirst({
    where: { userId, status: TestimonialStatus.PENDING },
    select: { id: true },
  });

  if (pendingSubmission) {
    throw new AppError(409, "You already have a testimonial waiting for review");
  }

  return prisma.testimonial.create({
    data: {
      userId,
      authorName: user.name?.trim() || user.email,
      quote: payload.quote.trim(),
      meta: payload.meta.trim(),
    },
    select: {
      id: true,
      authorName: true,
      quote: true,
      meta: true,
      status: true,
      createdAt: true,
    },
  });
};

const getMyTestimonials = async (userId: string) => {
  return prisma.testimonial.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      authorName: true,
      quote: true,
      meta: true,
      status: true,
      reviewReason: true,
      reviewedAt: true,
      createdAt: true,
    },
  });
};

const getAdminTestimonials = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm } = queryBuilder(query);
  const status = typeof query.status === "string" ? (query.status as TestimonialStatus) : undefined;
  const where: Prisma.TestimonialWhereInput = {
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            { authorName: { contains: searchTerm, mode: "insensitive" } },
            { quote: { contains: searchTerm, mode: "insensitive" } },
            { meta: { contains: searchTerm, mode: "insensitive" } },
            { user: { email: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, result, summary] = await Promise.all([
    prisma.testimonial.count({ where }),
    prisma.testimonial.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.testimonial.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    meta: { page, limit, total },
    summary: {
      pending: summary.find((item) => item.status === TestimonialStatus.PENDING)?._count._all ?? 0,
      approved: summary.find((item) => item.status === TestimonialStatus.APPROVED)?._count._all ?? 0,
      rejected: summary.find((item) => item.status === TestimonialStatus.REJECTED)?._count._all ?? 0,
      total,
    },
    result,
  };
};

const reviewTestimonial = async (
  testimonialId: string,
  reviewerId: string,
  payload: { status: "APPROVED" | "REJECTED"; reviewReason?: string; isFeatured?: boolean; displayOrder?: number },
) => {
  const existing = await prisma.testimonial.findUnique({ where: { id: testimonialId } });
  if (!existing) throw new AppError(404, "Testimonial not found");

  return prisma.$transaction(async (tx) => {
    if (payload.status === "APPROVED" && payload.isFeatured) {
      await tx.testimonial.updateMany({
        where: { isFeatured: true, NOT: { id: testimonialId } },
        data: { isFeatured: false },
      });
    }

    return tx.testimonial.update({
      where: { id: testimonialId },
      data: {
        status: payload.status,
        reviewReason: payload.status === "REJECTED" ? payload.reviewReason?.trim() || "Please revise your testimonial and submit again." : null,
        reviewedAt: new Date(),
        reviewer: { connect: { id: reviewerId } },
        ...(payload.status === "APPROVED" ? { isFeatured: payload.isFeatured ?? existing.isFeatured } : { isFeatured: false }),
        ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
  });
};

export const testimonialService = {
  getPublicTestimonials,
  createTestimonial,
  getMyTestimonials,
  getAdminTestimonials,
  reviewTestimonial,
};
