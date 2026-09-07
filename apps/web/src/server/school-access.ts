import { prisma } from '@km/db';
import type { UserContext } from './context';

export type SchoolNavItem = {
  href: string;
  label: string;
  module?: 'attendance' | 'tuition' | 'health' | 'nutrition' | 'school-years' | 'students' | 'staff' | 'schools' | 'dashboard';
};

const baseNavItems: SchoolNavItem[] = [
  { href: '', label: 'Tổng quan', module: 'dashboard' },
  { href: '/schools', label: 'Trường học', module: 'schools' },
  { href: '/years', label: 'Năm học', module: 'school-years' },
  { href: '/classes', label: 'Lớp học', module: 'school-years' },
  { href: '/students', label: 'Học sinh', module: 'students' },
  { href: '/staff', label: 'Nhân sự', module: 'staff' },
  { href: '/attendance', label: 'Điểm danh', module: 'attendance' },
  { href: '/tuition', label: 'Học phí', module: 'tuition' },
  { href: '/health', label: 'Sức khỏe', module: 'health' },
  { href: '/settings/school-years', label: 'Thiết lập năm học', module: 'school-years' },
];

export async function resolveSchoolAccess(schoolSlug: string, user: UserContext) {
  const school = await prisma.school.findFirst({
    where: { slug: schoolSlug, deletedAt: null },
    include: { setting: true },
  });

  if (!school) return null;

  if (user.role === 'SYSTEM_ADMIN') {
    const session = await prisma.supportSession.findFirst({
      where: {
        adminId: user.id,
        schoolId: school.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    return session ? school : null;
  }

  if (user.role === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id, schoolId: school.id, deletedAt: null },
    });
    return admin ? school : null;
  }

  if (user.role === 'TEACHER' || user.role === 'STAFF') {
    const staff = await prisma.staffMember.findFirst({
      where: { userId: user.id, schoolId: school.id, deletedAt: null },
    });
    return staff ? school : null;
  }

  return null;
}

export async function listAccessibleSchools(user: UserContext) {
  if (user.role === 'SYSTEM_ADMIN') {
    const sessions = await prisma.supportSession.findMany({
      where: {
        adminId: user.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      select: { school: { select: { id: true, slug: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => session.school);
  }

  if (user.role === 'SCHOOL_ADMIN') {
    const admins = await prisma.schoolAdmin.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { school: { select: { id: true, slug: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((admin) => admin.school);
  }

  if (user.role === 'TEACHER' || user.role === 'STAFF') {
    const staff = await prisma.staffMember.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { school: { select: { id: true, slug: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return staff.map((item) => item.school);
  }

  return [];
}

export function filterSchoolNavItems(role: UserContext['role'], enabled: {
  enableAttendance?: boolean | null;
  enableTuition?: boolean | null;
  enableHealth?: boolean | null;
  enableNutrition?: boolean | null;
}) {
  return baseNavItems.filter((item) => {
    if (item.module === 'attendance' && !enabled.enableAttendance) return false;
    if (item.module === 'tuition' && !enabled.enableTuition) return false;
    if (item.module === 'health' && !enabled.enableHealth) return false;
    if (item.module === 'nutrition' && !enabled.enableNutrition) return false;
    if (role === 'TEACHER' && (item.module === 'tuition' || item.module === 'schools' || item.module === 'staff')) return false;
    if (role === 'STAFF' && item.module === 'tuition') return false;
    if (role === 'PARENT' && item.module !== 'dashboard') return false;
    return true;
  });
}

export { baseNavItems };
