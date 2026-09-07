import type { ParentRequestStatus, ParentRequestType } from './parent-requests-types';

// Re-export types for convenience
export type { ParentRequestStatus, ParentRequestType };

/**
 * Only PENDING requests may be cancelled by the parent.
 */
export function canCancelRequest(status: ParentRequestStatus): boolean {
  return status === 'PENDING';
}

/**
 * Only PENDING requests may be approved or rejected by school staff.
 */
export function canReviewRequest(status: ParentRequestStatus): boolean {
  return status === 'PENDING';
}

/**
 * Returns true if the request type is ABSENCE_LEAVE,
 * which triggers an attendance side-effect on approval.
 */
export function isLeaveRequest(type: ParentRequestType): boolean {
  return type === 'ABSENCE_LEAVE';
}

/**
 * Returns true if the request type is MEDICATION_INSTRUCTION,
 * which should display a reminder in the teacher's dashboard.
 */
export function isMedicationRequest(type: ParentRequestType): boolean {
  return type === 'MEDICATION_INSTRUCTION';
}

/**
 * Returns true if the request type is PICKUP_AUTHORIZATION,
 * which adds an authorized pickup person to the child's record.
 */
export function isPickupAuthorizationRequest(type: ParentRequestType): boolean {
  return type === 'PICKUP_AUTHORIZATION';
}

/**
 * Build an array of ISO date strings (YYYY-MM-DD) for all weekdays
 * between startDate and endDate (inclusive).
 * Skips Saturday (6) and Sunday (0).
 *
 * Uses UTC methods internally so the function is timezone-agnostic.
 * Used to create AttendanceRecord entries when ABSENCE_LEAVE is approved.
 */
export function buildLeaveAbsenceDates(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];

  // Normalize to UTC midnight to avoid timezone shifts
  const current = new Date(Date.UTC(
    startDate.getFullYear(), startDate.getMonth(), startDate.getDate(),
  ));
  const end = new Date(Date.UTC(
    endDate.getFullYear(), endDate.getMonth(), endDate.getDate(),
  ));

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const y = current.getUTCFullYear();
      const m = String(current.getUTCMonth() + 1).padStart(2, '0');
      const d = String(current.getUTCDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Human-readable labels for parent request types (Vietnamese).
 */
export const PARENT_REQUEST_TYPE_LABELS: Record<ParentRequestType, string> = {
  MEDICATION_INSTRUCTION: 'Dặn thuốc',
  LATE_PICKUP: 'Đón muộn',
  PICKUP_AUTHORIZATION: 'Cấp quyền đón',
  ABSENCE_LEAVE: 'Xin nghỉ học',
  CHILD_CONDITION_NOTE: 'Ghi chú sức khỏe',
  OTHER_REQUEST: 'Yêu cầu khác',
};

/**
 * Human-readable labels for parent request statuses (Vietnamese).
 */
export const PARENT_REQUEST_STATUS_LABELS: Record<ParentRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
};

/**
 * Status color mapping for UI badges.
 */
export const PARENT_REQUEST_STATUS_COLORS: Record<ParentRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-orange-100 text-orange-700',
};
