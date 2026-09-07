// ============================================================
// Granular Permissions & Standard Roles Definitions (Shared)
// ============================================================

export const ALL_PERMISSIONS = [
  { id: 'students:read', label: 'Xem hồ sơ học sinh', group: 'Học sinh' },
  { id: 'students:manage', label: 'Tiếp nhận & Chuyển lớp', group: 'Học sinh' },
  { id: 'attendance:read', label: 'Xem nhật ký điểm danh', group: 'Điểm danh' },
  { id: 'attendance:write', label: 'Điểm danh & Đón trả trẻ', group: 'Điểm danh' },
  { id: 'tuition:read', label: 'Xem biểu phí & hóa đơn', group: 'Học phí' },
  { id: 'tuition:manage', label: 'Lập phiếu thu & Quản lý thu phí', group: 'Học phí' },
  { id: 'health:read', label: 'Xem chỉ số BMI & Hồ sơ y tế', group: 'Sức khỏe' },
  { id: 'health:write', label: 'Khám sức khỏe & Đo thể trạng', group: 'Sức khỏe' },
  { id: 'nutrition:read', label: 'Xem thực đơn dinh dưỡng', group: 'Dinh dưỡng' },
  { id: 'nutrition:write', label: 'Lập thực đơn & Phiếu chợ', group: 'Dinh dưỡng' },
  { id: 'staff:read', label: 'Xem danh sách nhân sự', group: 'Nhân sự' },
  { id: 'staff:manage', label: 'Tiếp nhận & Phân quyền nhân sự', group: 'Nhân sự' },
  { id: 'classes:read', label: 'Xem danh sách lớp học', group: 'Lớp học' },
  { id: 'classes:manage', label: 'Quản lý lớp & Phân công giáo viên', group: 'Lớp học' },
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number]['id'];

export interface RoleDefinition {
  label: string;
  badgeColor: string;
  defaultPermissions: PermissionKey[];
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  VICE_PRINCIPAL: {
    label: 'Phó Hiệu trưởng',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    defaultPermissions: [
      'students:read',
      'students:manage',
      'attendance:read',
      'attendance:write',
      'tuition:read',
      'health:read',
      'health:write',
      'nutrition:read',
      'nutrition:write',
      'staff:read',
      'classes:read',
      'classes:manage',
    ],
  },
  TEACHER: {
    label: 'Giáo viên Chủ nhiệm',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    defaultPermissions: [
      'students:read',
      'attendance:read',
      'attendance:write',
      'health:read',
      'health:write',
      'nutrition:read',
      'classes:read',
    ],
  },
  ASSISTANT_TEACHER: {
    label: 'Giáo viên Phụ trách',
    badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    defaultPermissions: [
      'students:read',
      'attendance:read',
      'attendance:write',
      'health:read',
      'classes:read',
    ],
  },
  ACCOUNTANT: {
    label: 'Kế toán',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    defaultPermissions: [
      'students:read',
      'tuition:read',
      'tuition:manage',
      'classes:read',
    ],
  },
  NURSE: {
    label: 'Y tế Học đường',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    defaultPermissions: [
      'students:read',
      'health:read',
      'health:write',
      'nutrition:read',
    ],
  },
  KITCHEN_STAFF: {
    label: 'Nhân viên Bếp',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    defaultPermissions: [
      'nutrition:read',
      'nutrition:write',
    ],
  },
  DRIVER: {
    label: 'Tài xế Đưa đón',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    defaultPermissions: [
      'students:read',
      'attendance:read',
      'attendance:write',
    ],
  },
  SECURITY: {
    label: 'Nhân viên Bảo vệ',
    badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    defaultPermissions: [
      'attendance:read',
      'attendance:write',
    ],
  },
  OTHER: {
    label: 'Nhân sự Khác',
    badgeColor: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    defaultPermissions: [],
  },
};
