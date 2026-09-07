import { router } from '../trpc';
import { parentProcedure } from './school-procedure';
import { prisma } from '@km/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const parentPortalRouter = router({
  // List all children linked to parent's phone
  listChildren: parentProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Find parent identity by phone (userId might phone or user id)
    const parentIdentity = await prisma.parentIdentity.findFirst({
      where: {
        // Try match by phone or create mapping
        phone: ctx.user.email || userId, // email might phone in our auth
      },
    });

    if (!parentIdentity) {
      return [];
    }

    // Get all active links children
    const links = await prisma.responsiblePerson.findMany({
      where: {
        parentIdentityId: parentIdentity.id,
        deletedAt: null,
      },
      include: {
        relationship: {
          include: {
            student: true,
            school: true,
            schoolYear: true,
            classMemberships: {
              where: { endedAt: null },
              include: { class: true },
            },
          },
        },
      },
    });

    return links.map((link) => ({
      id: link.relationship.id,
      name: `${link.relationship.student.lastName} ${link.relationship.student.firstName}`,
      gender: link.relationship.student.gender,
      dateOfBirth: link.relationship.student.dateOfBirth,
      schoolId: link.relationship.schoolId,
      schoolName: link.relationship.school.name,
      schoolSlug: link.relationship.school.slug,
      schoolYear: link.relationship.schoolYear?.name,
      class: link.relationship.classMemberships[0]?.class?.name,
      relationType: link.type,
      isCurrent: link.studentSchoolRelationshipId === ctx.user.childId,
    }));
  }),

  // Switch active child context
  switchChild: parentProcedure
    .input(z.object({ childId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify child belongs to parent
      const parentIdentity = await prisma.parentIdentity.findFirst({
        where: { phone: ctx.user.email || userId },
      });

      if (!parentIdentity) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent identity not found' });
      }

      const link = await prisma.responsiblePerson.findFirst({
        where: {
          studentSchoolRelationshipId: input.childId,
          parentIdentityId: parentIdentity.id,
        },
        include: {
          relationship: {
            include: {
              school: true,
            },
          },
        },
      });

      if (!link) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Child not linked to parent' });
      }

      // Update user session childId - this is handled by the auth system
      // For now, just return the link info for client to use
      return {
        childId: link.studentSchoolRelationshipId,
        schoolId: link.relationship.schoolId,
        schoolSlug: link.relationship.school.slug,
        message: 'Child switched successfully. Please refresh to apply.',
      };
    }),

  // Get tuition/invoices for selected child (published only)
  getTuition: parentProcedure.query(async ({ ctx }) => {
    const childId = ctx.user.childId!;
    const schoolId = ctx.user.activeSchoolId!;

    // Get enrollment (StudentSchoolRelationship) for child
    const enrollment = await prisma.studentSchoolRelationship.findUnique({
      where: { id: childId, schoolId },
    });

    if (!enrollment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
    }

    // Get published invoices for this enrollment
    const invoices = await prisma.invoice.findMany({
      where: {
        studentSchoolRelationshipId: childId,
        deletedAt: null,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] }, // Only published states
      },
      include: {
        items: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return invoices.map((inv) => ({
      ...inv,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      balance: Number(inv.totalAmount) - Number(inv.paidAmount),
    }));
  }),

  // Get health records for selected child
  getHealth: parentProcedure.query(async ({ ctx }) => {
    const childId = ctx.user.childId!;
    const schoolId = ctx.user.activeSchoolId!;

    const records = await prisma.healthRecord.findMany({
      where: { studentSchoolRelationshipId: childId, schoolId },
      orderBy: { measuredAt: 'desc' },
    });

    return records.map((r) => ({
      ...r,
      heightCm: Number(r.heightCm),
      weightKg: Number(r.weightKg),
      bmi: Number(r.bmi),
    }));
  }),

  // Get published menus for the child's school
  getMenu: parentProcedure
    .input(
      z.object({
        weekStartDate: z.coerce.date().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const schoolId = ctx.user.activeSchoolId!;

      const where: Record<string, unknown> = {
        schoolId,
        isPublished: true,
        deletedAt: null,
      };

      if (input?.weekStartDate) {
        where.weekStartDate = input.weekStartDate;
      }

      const menus = await prisma.menu.findMany({
        where: where as Record<string, unknown>,
        orderBy: { weekStartDate: 'desc' },
        take: 4, // Latest 4 weeks
      });

      return menus;
    }),

  // Get school settings for parent view
  getSchoolInfo: parentProcedure.query(async ({ ctx }) => {
    const schoolId = ctx.user.activeSchoolId!;
    const settings = await prisma.schoolSetting.findUnique({
      where: { schoolId },
    });
    return settings;
  }),
});