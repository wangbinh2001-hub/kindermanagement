/**
 * Type aliases extracted from Zod enums for use in pure utility functions.
 * These mirror the Prisma enums but live in the validators package
 * so that utils don't depend on @km/db.
 */
export type ParentRequestType =
  | 'MEDICATION_INSTRUCTION'
  | 'LATE_PICKUP'
  | 'PICKUP_AUTHORIZATION'
  | 'ABSENCE_LEAVE'
  | 'CHILD_CONDITION_NOTE'
  | 'OTHER_REQUEST';

export type ParentRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';
