import type { UserContext } from '../context';

type StudentAccessSubject = {
  role: UserContext['role'];
  roles: string[];
  permissions: string[];
};

const STUDENT_READER_ROLES = new Set(['TEACHER', 'ASSISTANT_TEACHER', 'ACCOUNTANT', 'NURSE']);
const STUDENT_PII_READER_ROLES = new Set(['TEACHER', 'ASSISTANT_TEACHER']);

export function canReadStudents(subject: StudentAccessSubject): boolean {
  if (subject.role === 'SCHOOL_ADMIN' || subject.role === 'SYSTEM_ADMIN') return true;
  return (
    subject.permissions.includes('students:read') ||
    subject.roles.some((role) => STUDENT_READER_ROLES.has(role))
  );
}

export function canManageStudents(subject: StudentAccessSubject): boolean {
  if (subject.role === 'SCHOOL_ADMIN') return true;
  return subject.permissions.includes('students:manage');
}

export function canManageClassMembership(subject: StudentAccessSubject): boolean {
  if (subject.role === 'SCHOOL_ADMIN') return true;
  if (subject.permissions.includes('class_membership:manage')) return true;
  return subject.roles.some((role) => role === 'TEACHER' || role === 'ASSISTANT_TEACHER');
}

export function canReadStudentPii(subject: StudentAccessSubject): boolean {
  if (subject.role === 'SCHOOL_ADMIN' || subject.role === 'SYSTEM_ADMIN') return true;
  if (subject.permissions.includes('students:pii_read')) return true;
  return subject.roles.some((role) => STUDENT_PII_READER_ROLES.has(role));
}

export function maskCitizenId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length < 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

export function maskPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length < 7) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
