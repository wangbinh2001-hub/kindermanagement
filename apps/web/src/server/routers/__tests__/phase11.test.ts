import { describe, it, expect } from 'vitest';
import {
  maskPhone,
  maskEmail,
  maskIdNumber,
  maskAuditLogEntry,
  listAuditLogsSchema,
  listNotificationsSchema,
} from '@km/validators';

describe('Phase 11: Audit Logs & Notifications Schemas & PII Logic', () => {
  it('validates listAuditLogsSchema defaults and ranges', () => {
    const parsed = listAuditLogsSchema.parse({});
    expect(parsed.limit).toBe(50);

    const filtered = listAuditLogsSchema.parse({
      limit: 20,
      entityType: 'Student',
      action: 'CREATE',
      schoolId: 'school-123',
    });
    expect(filtered.entityType).toBe('Student');
    expect(filtered.limit).toBe(20);
  });

  it('validates listNotificationsSchema defaults and types', () => {
    const parsed = listNotificationsSchema.parse({});
    expect(parsed.limit).toBe(20);

    const withRead = listNotificationsSchema.parse({
      isRead: false,
      limit: 10,
    });
    expect(withRead.isRead).toBe(false);
  });

  it('correctly masks audit log entries with nested PII fields', () => {
    const log = {
      id: 'log-1',
      schoolId: 'school-1',
      userId: 'user-1',
      userRole: 'SCHOOL_ADMIN',
      entityType: 'Student',
      entityId: 'stu-1',
      action: 'UPDATE',
      beforeJson: {
        firstName: 'John',
        phone: '0901234567',
        email: 'john.doe@example.com',
        idCardNumber: '001234567890',
      },
      afterJson: {
        firstName: 'Johnathan',
        phone: '0909876543',
        email: 'johnathan.new@example.com',
      },
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const masked = maskAuditLogEntry(log);

    const before = masked.beforeJson as Record<string, string>;
    const after = masked.afterJson as Record<string, string>;

    expect(before.phone).toBe('090*****67');
    expect(before.email).toBe('j***@example.com');
    expect(before.idCardNumber).toBe('0012****7890');
    expect(before.firstName).toBe('John'); // Non-PII preserved

    expect(after.phone).toBe('090*****43');
    expect(after.email).toBe('j***@example.com');
  });
});
