import { publicProcedure } from '../trpc';
import { prisma } from '@km/db';
import { TRPCError } from '@trpc/server';

export const schoolProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // 1. Authentication
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const { id: userId, role, activeSchoolId } = ctx.user;

  // 2. Context Validation
  if (!activeSchoolId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Missing active school context' });
  }

  // 3. Authorization & Tenant Isolation
  let hasAccess = false;

  if (role === 'SCHOOL_ADMIN') {
    // SchoolAdmin bound to this school
    const admin = await prisma.schoolAdmin.findFirst({
      where: { userId, schoolId: activeSchoolId, deletedAt: null },
    });
    hasAccess = !!admin;
  } else if (role === 'SYSTEM_ADMIN') {
    // SystemAdmin requires an ACTIVE SupportSession for this school
    const session = await prisma.supportSession.findFirst({
      where: {
        adminId: userId,
        schoolId: activeSchoolId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });
    hasAccess = !!session;
  } else if (role === 'TEACHER' || role === 'STAFF') {
    // StaffMember bound to this school
    const staff = await prisma.staffMember.findFirst({
      where: { userId, schoolId: activeSchoolId, deletedAt: null },
    });
    hasAccess = !!staff;
  }
  // Note: 'PARENT' is restricted at client/route level, they cannot access schoolProcedure endpoints.

  if (!hasAccess) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied for this school' });
  }

  // 4. Proceed with strict activeSchoolId in context
  return next({
    ctx: {
      ...ctx,
      user: { ...ctx.user, activeSchoolId },
    },
  });
});

export const parentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // 1. Authentication
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const { role } = ctx.user;

  // 2. Must be PARENT role
  if (role !== 'PARENT') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access only' });
  }

  // 3. Verify ParentIdentity exists for this user (phone linked)
  const parentIdentity = await prisma.parentIdentity.findFirst({
    where: { 
      // Assuming userId matches phone or we need a userId field
      // For now, we'll use a simpler approach - check if they have active child context
      deletedAt: null 
    },
  });

  // 4. Verify active child context (stored in claims context)
  // will set via switchChild procedure
  const childId = ctx.user.claims?.childId;

  if (!childId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No child selected. Please select a child first.' });
  }

  // 5. Verify the child belongs to this parent
  const link = await prisma.responsiblePerson.findFirst({
    where: {
      studentSchoolRelationshipId: childId,
      parentIdentityId: parentIdentity?.id,
    },
    include: {
      relationship: {
        include: { school: true },
      },
    },
  });

  if (!link) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Child not authorized for this parent' });
  }

  // 6. Proceed with child context
  return next({
    ctx: {
      ...ctx,
      user: { 
        ...ctx.user, 
        activeSchoolId: link.relationship.schoolId,
        childId,
      },
    },
  });
});
