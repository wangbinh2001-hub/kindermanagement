import { describe, expect, it } from 'vitest';
import {
  canCancelRequest,
  canReviewRequest,
  isLeaveRequest,
  isMedicationRequest,
  isPickupAuthorizationRequest,
  buildLeaveAbsenceDates,
  PARENT_REQUEST_TYPE_LABELS,
  PARENT_REQUEST_STATUS_LABELS,
} from '../utils/parent-requests';
import type { ParentRequestStatus, ParentRequestType } from '../utils/parent-requests-types';

describe('canCancelRequest', () => {
  it('allows cancellation of PENDING requests', () => {
    expect(canCancelRequest('PENDING')).toBe(true);
  });

  it.each<ParentRequestStatus>(['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])(
    'rejects cancellation of %s requests',
    (status) => {
      expect(canCancelRequest(status)).toBe(false);
    },
  );
});

describe('canReviewRequest', () => {
  it('allows review of PENDING requests', () => {
    expect(canReviewRequest('PENDING')).toBe(true);
  });

  it.each<ParentRequestStatus>(['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])(
    'rejects review of %s requests',
    (status) => {
      expect(canReviewRequest(status)).toBe(false);
    },
  );
});

describe('request type checks', () => {
  it('isLeaveRequest returns true only for ABSENCE_LEAVE', () => {
    expect(isLeaveRequest('ABSENCE_LEAVE')).toBe(true);
    expect(isLeaveRequest('MEDICATION_INSTRUCTION')).toBe(false);
    expect(isLeaveRequest('LATE_PICKUP')).toBe(false);
    expect(isLeaveRequest('OTHER_REQUEST')).toBe(false);
  });

  it('isMedicationRequest returns true only for MEDICATION_INSTRUCTION', () => {
    expect(isMedicationRequest('MEDICATION_INSTRUCTION')).toBe(true);
    expect(isMedicationRequest('ABSENCE_LEAVE')).toBe(false);
  });

  it('isPickupAuthorizationRequest returns true only for PICKUP_AUTHORIZATION', () => {
    expect(isPickupAuthorizationRequest('PICKUP_AUTHORIZATION')).toBe(true);
    expect(isPickupAuthorizationRequest('LATE_PICKUP')).toBe(false);
  });
});

describe('buildLeaveAbsenceDates', () => {
  // Use new Date(y, m-1, d) to construct local dates, avoiding UTC parse shift.
  // 2026-09-07 is a Monday.

  it('returns all weekdays in a single-day range (weekday)', () => {
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 7), new Date(2026, 8, 7));
    expect(dates).toEqual(['2026-09-07']);
  });

  it('returns all weekdays in a multi-day range', () => {
    // Mon 2026-09-07 to Fri 2026-09-11
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 7), new Date(2026, 8, 11));
    expect(dates).toEqual([
      '2026-09-07', // Mon
      '2026-09-08', // Tue
      '2026-09-09', // Wed
      '2026-09-10', // Thu
      '2026-09-11', // Fri
    ]);
  });

  it('skips weekends', () => {
    // Fri 2026-09-11 to Tue 2026-09-15
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 11), new Date(2026, 8, 15));
    expect(dates).toEqual([
      '2026-09-11', // Fri
      '2026-09-14', // Mon
      '2026-09-15', // Tue
    ]);
  });

  it('returns empty array for weekend-only range', () => {
    // Sat 2026-09-12 to Sun 2026-09-13
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 12), new Date(2026, 8, 13));
    expect(dates).toEqual([]);
  });

  it('returns empty array when startDate > endDate', () => {
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 10), new Date(2026, 8, 7));
    expect(dates).toEqual([]);
  });

  it('handles a full two-week range correctly', () => {
    // Mon 2026-09-07 to Fri 2026-09-18
    const dates = buildLeaveAbsenceDates(new Date(2026, 8, 7), new Date(2026, 8, 18));
    expect(dates).toHaveLength(10); // 10 weekdays
    // Verify no weekends — parse as UTC to avoid local-tz day shift
    dates.forEach((d) => {
      const parts = d.split('-').map(Number);
      const y = parts[0] ?? 2026;
      const m = parts[1] ?? 1;
      const day = parts[2] ?? 1;
      const utcDate = new Date(Date.UTC(y, m - 1, day));
      expect(utcDate.getUTCDay()).not.toBe(0); // not Sunday
      expect(utcDate.getUTCDay()).not.toBe(6); // not Saturday
    });
  });
});

describe('label maps', () => {
  it('has labels for all 6 request types', () => {
    const types: ParentRequestType[] = [
      'MEDICATION_INSTRUCTION',
      'LATE_PICKUP',
      'PICKUP_AUTHORIZATION',
      'ABSENCE_LEAVE',
      'CHILD_CONDITION_NOTE',
      'OTHER_REQUEST',
    ];
    types.forEach((t) => {
      expect(PARENT_REQUEST_TYPE_LABELS[t]).toBeTruthy();
    });
  });

  it('has labels for all 5 statuses', () => {
    const statuses: ParentRequestStatus[] = [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED',
    ];
    statuses.forEach((s) => {
      expect(PARENT_REQUEST_STATUS_LABELS[s]).toBeTruthy();
    });
  });
});
