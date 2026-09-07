import { z } from 'zod';

// ============================================================
// School Provisioning (Module 01 §2.1)
// ============================================================

export const provisionSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(100),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional(),
  address: z.string().max(500).optional(),
  initialUsername: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập chỉ chứa ký tự chữ, số và _.-'),
  initialPassword: z.string().min(6).max(100),
});

export type ProvisionSchoolInput = z.infer<typeof provisionSchoolSchema>;

// ============================================================
// School Lifecycle: Suspend & Delete (Module 01 §2.2)
// ============================================================

export const listSchoolsFilterSchema = z.object({
  status: z.enum(['PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const updateSchoolStatusSchema = z.object({
  schoolId: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().max(500).optional(),
});

export const deleteSchoolSchema = z.object({
  schoolId: z.string(),
  confirmationCode: z.string(), // Step 1: type school_code
  adminPassword: z.string().min(1), // Step 2: verify system admin password
});

// ============================================================
// Support Access: Normal & Emergency (Module 01 §2.3)
// ============================================================

export const createSupportRequestSchema = z.object({
  schoolId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  isEmergency: z.boolean().default(false),
});

export const startSupportSessionSchema = z.object({
  requestId: z.string(),
  scope: z.enum(['FULL_READ']).default('FULL_READ'),
  durationMinutes: z.number().int().min(15).max(480).default(60), // Default 1 hour, max 8 hours
  reason: z.string().min(20, 'Lý do truy cập phải có tối thiểu 20 ký tự'),
});

export const closeSupportSessionSchema = z.object({
  sessionId: z.string(),
  resolutionSummary: z.string().max(1000).optional(),
});

// ============================================================
// Per-school feature flags (Phase 2 P2.4)
// ============================================================

export const updateFeatureFlagsSchema = z.object({
  schoolId: z.string(),
  enableAttendance: z.boolean().optional(),
  enableTuition: z.boolean().optional(),
  enableHealth: z.boolean().optional(),
  enableNutrition: z.boolean().optional(),
});

export const getSchoolSchema = z.object({
  schoolId: z.string(),
});

