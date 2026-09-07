import { z } from 'zod';

export const AgeGroupEnum = z.enum([
  'NURSERY_12_18M',
  'NURSERY_18_24M',
  'NURSERY_24_36M',
  'PRESCHOOL_3_4Y',
  'PRESCHOOL_4_5Y',
  'PRESCHOOL_5_6Y',
]);

export type AgeGroup = z.infer<typeof AgeGroupEnum>;

// ============================================================
// School Years
// ============================================================

export const createSchoolYearSchema = z.object({
  name: z.string().min(2).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateSchoolYearSchema = z.object({
  schoolYearId: z.string(),
  name: z.string().min(2).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const setCurrentSchoolYearSchema = z.object({
  schoolYearId: z.string(),
});

export const archiveSchoolYearSchema = z.object({
  schoolYearId: z.string(),
});

// ============================================================
// Classes
// ============================================================

export const classFilterSchema = z.object({
  schoolYearId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createClassSchema = z.object({
  schoolYearId: z.string(),
  name: z.string().min(2).max(50),
  ageGroup: AgeGroupEnum,
  capacity: z.number().int().min(1).max(100).default(30),
  isActive: z.boolean().optional().default(true),
});

export const updateClassSchema = z.object({
  classId: z.string(),
  name: z.string().min(2).max(50).optional(),
  ageGroup: AgeGroupEnum.optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const deleteClassSchema = z.object({
  classId: z.string(),
});

// ============================================================
// School Profile & Settings
// ============================================================

export const updateSchoolProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(5).max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  taxCode: z.string().max(50).optional().or(z.literal('')),
  legalRepresentative: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const updateSchoolSettingsSchema = z.object({
  currentSchoolYearId: z.string().optional().nullable(),
  enableAttendance: z.boolean().optional(),
  enableTuition: z.boolean().optional(),
  enableHealth: z.boolean().optional(),
  enableNutrition: z.boolean().optional(),
  notificationConfig: z
    .object({
      emailSenderName: z.string().max(100).optional(),
      templates: z.record(z.string()).optional(),
    })
    .optional(),
});