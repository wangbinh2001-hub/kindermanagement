import { z } from 'zod';

// ── List audit logs (School Admin / System Admin) ────────────────
export const listAuditLogsSchema = z.object({
  schoolId: z.string().optional(), // System Admin can filter by school
  entityType: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;

// ── Get single audit log by ID ───────────────────────────────────
export const getAuditLogByIdSchema = z.object({
  id: z.string().min(1),
});

export type GetAuditLogByIdInput = z.infer<typeof getAuditLogByIdSchema>;

// ── Constants ────────────────────────────────────────────────────
export const AUDIT_ENTITY_TYPES = [
  'Student',
  'StudentSchoolRelationship',
  'Invoice',
  'FeeItem',
  'StudentReduction',
  'SchoolSetting',
  'SchoolYear',
  'Class',
  'StaffMember',
  'ParentRequest',
  'HealthRecord',
  'Menu',
  'User',
] as const;

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  Student: 'Học sinh',
  StudentSchoolRelationship: 'Hồ sơ nhập học',
  Invoice: 'Hóa đơn',
  FeeItem: 'Biểu phí',
  StudentReduction: 'Giảm trừ học sinh',
  SchoolSetting: 'Cài đặt trường',
  SchoolYear: 'Năm học',
  Class: 'Lớp học',
  StaffMember: 'Nhân sự',
  ParentRequest: 'Yêu cầu PH',
  HealthRecord: 'Sức khỏe',
  Menu: 'Thực đơn',
  User: 'Người dùng',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  RESTORE: 'Khôi phục',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  PASSWORD_CHANGE: 'Đổi mật khẩu',
  PASSWORD_RESET: 'Reset mật khẩu',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  CREATE_PARENT_REQUEST: 'Tạo yêu cầu PH',
  CANCEL_PARENT_REQUEST: 'Hủy yêu cầu PH',
  APPROVE_PARENT_REQUEST: 'Duyệt yêu cầu PH',
  REJECT_PARENT_REQUEST: 'Từ chối yêu cầu PH',
};
