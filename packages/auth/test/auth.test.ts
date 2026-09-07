import { describe, it, expect } from 'vitest';
import {
  AuthService,
  authService,
  requirePasswordChange,
  temporaryPasswordSchema,
  signUpSchema,
  signInSchema,
  passwordResetSchema,
  updatePasswordSchema,
} from '../src/index';

describe('Auth Foundation (P1.4)', () => {
  describe('Temporary password handling', () => {
    it('requires password change when password is marked temporary', () => {
      expect(requirePasswordChange({ isTemporaryPassword: true })).toBe(true);
      expect(requirePasswordChange({ isTemporaryPassword: false })).toBe(false);
    });

    it('validates temporary password contract schema', () => {
      const valid = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        isTemporary: true,
        mustChangeBefore: new Date().toISOString(),
      };
      expect(temporaryPasswordSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        userId: 'not-a-uuid',
        isTemporary: false,
        mustChangeBefore: 'invalid-date',
      };
      expect(temporaryPasswordSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('JWT Claims and RLS extraction', () => {
    it('correctly parses claims from token', () => {
      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {
          role: 'SCHOOL_ADMIN',
          school_id: 'school-123',
          is_temporary_password: true,
        },
      };

      const base64Payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
      const fakeToken = 'header.' + base64Payload + '.signature';

      const claims = authService.getJWTClaims({
        access_token: fakeToken,
      } as unknown as import('@supabase/supabase-js').Session);

      expect(claims).not.toBeNull();
      expect(claims?.role).toBe('SCHOOL_ADMIN');
      expect(claims?.school_id).toBe('school-123');
      expect(claims?.is_temporary_password).toBe(true);
      expect(claims?.sub).toBe('test-user-id');
    });

    it('identifies temporary password state from session', () => {
      const mockPayload = {
        sub: 'test-user-id',
        app_metadata: {
          is_temporary_password: true,
        },
      };

      const base64Payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
      const fakeToken = 'header.' + base64Payload + '.signature';

      expect(
        authService.hasTemporaryPassword({
          access_token: fakeToken,
        } as unknown as import('@supabase/supabase-js').Session)
      ).toBe(true);
    });

    it('resolves active school ID properly', () => {
      const mockPayload = {
        sub: 'test-user-id',
        app_metadata: {
          school_id: 'token-school-id',
        },
      };

      const base64Payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
      const fakeToken = 'header.' + base64Payload + '.signature';

      const session = { access_token: fakeToken } as unknown as import('@supabase/supabase-js').Session;

      // Header takes precedence
      expect(authService.getActiveSchoolId(session, 'header-school-id')).toBe('header-school-id');
      // Falls back to claim
      expect(authService.getActiveSchoolId(session)).toBe('token-school-id');
    });
  });

  describe('Validation schemas', () => {
    it('validates sign up inputs', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };
      expect(signUpSchema.safeParse(valid).success).toBe(true);

      const invalidEmail = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(signUpSchema.safeParse(invalidEmail).success).toBe(false);

      const shortPassword = {
        email: 'test@example.com',
        password: 'short',
      };
      expect(signUpSchema.safeParse(shortPassword).success).toBe(false);
    });

    it('validates password matching on update', () => {
      const valid = {
        password: 'new-password-123',
        confirmPassword: 'new-password-123',
      };
      expect(updatePasswordSchema.safeParse(valid).success).toBe(true);

      const mismatch = {
        password: 'new-password-123',
        confirmPassword: 'different-password',
      };
      expect(updatePasswordSchema.safeParse(mismatch).success).toBe(false);
    });
  });
});
