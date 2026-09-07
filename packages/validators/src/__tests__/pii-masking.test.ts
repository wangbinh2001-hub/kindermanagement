import { describe, it, expect } from 'vitest';
import {
  maskPhone,
  maskEmail,
  maskIdNumber,
  maskPiiInObject,
  maskAuditLogEntry,
} from '../utils/pii-masking';

describe('PII Masking Utils', () => {
  // ── maskPhone ──────────────────────────────────────────────────
  describe('maskPhone', () => {
    it('masks standard 10-digit phone', () => {
      expect(maskPhone('0963124567')).toBe('096*****67');
    });

    it('masks 11-digit phone', () => {
      expect(maskPhone('09631245678')).toBe('096******78');
    });

    it('handles short phone numbers', () => {
      expect(maskPhone('12345')).toBe('***');
    });

    it('handles null/undefined', () => {
      expect(maskPhone(null)).toBe('—');
      expect(maskPhone(undefined)).toBe('—');
    });

    it('strips spaces before masking', () => {
      expect(maskPhone('096 312 4567')).toBe('096*****67');
    });
  });

  // ── maskEmail ──────────────────────────────────────────────────
  describe('maskEmail', () => {
    it('masks standard email', () => {
      expect(maskEmail('hello@gmail.com')).toBe('h***@gmail.com');
    });

    it('masks short local part', () => {
      expect(maskEmail('a@example.org')).toBe('a***@example.org');
    });

    it('handles null/undefined', () => {
      expect(maskEmail(null)).toBe('—');
      expect(maskEmail(undefined)).toBe('—');
    });

    it('handles invalid email (no @)', () => {
      expect(maskEmail('notanemail')).toBe('***');
    });
  });

  // ── maskIdNumber ───────────────────────────────────────────────
  describe('maskIdNumber', () => {
    it('masks 12-digit CCCD', () => {
      expect(maskIdNumber('079123456789')).toBe('0791****6789');
    });

    it('masks 9-digit CMND', () => {
      expect(maskIdNumber('123456789')).toBe('1234*6789');
    });

    it('handles short ID', () => {
      expect(maskIdNumber('1234567')).toBe('***');
    });

    it('handles null/undefined', () => {
      expect(maskIdNumber(null)).toBe('—');
      expect(maskIdNumber(undefined)).toBe('—');
    });
  });

  // ── maskPiiInObject ────────────────────────────────────────────
  describe('maskPiiInObject', () => {
    it('masks phone fields in flat object', () => {
      const result = maskPiiInObject({
        name: 'Test',
        phone: '0963124567',
      });
      expect(result).toEqual({
        name: 'Test',
        phone: '096*****67',
      });
    });

    it('masks email fields', () => {
      const result = maskPiiInObject({ email: 'test@example.com' });
      expect(result).toEqual({ email: 't***@example.com' });
    });

    it('masks CCCD fields', () => {
      const result = maskPiiInObject({ cccd: '079123456789' });
      expect(result).toEqual({ cccd: '0791****6789' });
    });

    it('masks nested objects', () => {
      const result = maskPiiInObject({
        student: { name: 'A', phone: '0901234567' },
      });
      expect(result).toEqual({
        student: { name: 'A', phone: '090*****67' },
      });
    });

    it('masks arrays', () => {
      const result = maskPiiInObject([
        { phone: '0901111111' },
        { phone: '0902222222' },
      ]);
      expect(result).toEqual([
        { phone: '090*****11' },
        { phone: '090*****22' },
      ]);
    });

    it('preserves non-PII fields', () => {
      const result = maskPiiInObject({ id: '123', status: 'ACTIVE', amount: 5000 });
      expect(result).toEqual({ id: '123', status: 'ACTIVE', amount: 5000 });
    });

    it('handles null/undefined', () => {
      expect(maskPiiInObject(null)).toBeNull();
      expect(maskPiiInObject(undefined)).toBeUndefined();
    });
  });

  // ── maskAuditLogEntry ──────────────────────────────────────────
  describe('maskAuditLogEntry', () => {
    it('masks PII in beforeJson and afterJson', () => {
      const entry = {
        id: 'log-1',
        beforeJson: { phone: '0901234567', name: 'Old' },
        afterJson: { phone: '0909876543', name: 'New' },
        metadata: { ip: '1.2.3.4' },
      };

      const masked = maskAuditLogEntry(entry);

      expect(masked.beforeJson).toEqual({ phone: '090*****67', name: 'Old' });
      expect(masked.afterJson).toEqual({ phone: '090*****43', name: 'New' });
      expect(masked.id).toBe('log-1');
    });

    it('handles null beforeJson/afterJson', () => {
      const entry = {
        id: 'log-2',
        beforeJson: undefined,
        afterJson: undefined,
        metadata: undefined,
      };

      const masked = maskAuditLogEntry(entry);
      expect(masked.beforeJson).toBeUndefined();
      expect(masked.afterJson).toBeUndefined();
    });
  });
});
