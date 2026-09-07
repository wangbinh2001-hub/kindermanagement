// Phase 1.4 auth foundation: Supabase Auth setup, JWT config, email/password, session handling, password reset, RLS integration.

import { z } from 'zod';
import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'placeholder';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'placeholder';

// Server-side Supabase client (service role for admin operations)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Client-side Supabase client (anon key for user operations)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

// Type definitions
export type AuthUser = User & {
  app_metadata: {
    role?: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
    school_id?: string;
    is_temporary_password?: boolean;
  };
  user_metadata: {
    full_name?: string;
    phone?: string;
  };
};

export type AuthSession = Session;

// Supabase JWT claims for RLS policies
export type JWTClaims = {
  sub: string;
  role: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  school_id?: string;
  email?: string;
  is_temporary_password?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  aud?: string;
  exp?: number;
};

// Temporary password contract (Phase 1.4)
export const temporaryPasswordSchema = z.object({
  userId: z.string().uuid(),
  isTemporary: z.literal(true),
  mustChangeBefore: z.coerce.date(),
});

export const requirePasswordChange = (
  state: { isTemporaryPassword: boolean },
): boolean => state.isTemporaryPassword;

export const authContractVersion = 'phase_1_4';

// Auth result types
export type AuthResult<T = AuthUser> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type SignUpData = {
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  role?: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  schoolId?: string;
  isTemporaryPassword?: boolean;
  redirectTo?: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type PasswordResetData = {
  email: string;
  redirectTo?: string;
};

export type UpdatePasswordData = {
  password: string;
  confirmPassword: string;
};

export type UpdateProfileData = {
  fullName?: string;
  phone?: string;
};

// Validation schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  role: z.enum(['SYSTEM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'PARENT']).optional(),
  schoolId: z.string().uuid().optional(),
  isTemporaryPassword: z.boolean().optional(),
  redirectTo: z.string().url().optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirectTo: z.string().url().optional(),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name cannot be empty').optional(),
  phone: z.string().optional(),
});

// Auth service class
export class AuthService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabaseClient) {
    this.client = client;
  }

  // Sign up with email/password
  async signUp(data: SignUpData): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
    try {
      const { email, password, phone, fullName, role, schoolId, isTemporaryPassword, redirectTo } = data;

      const { data: authData, error } = await this.client.auth.signUp({
        email,
        password,
        phone,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      // Update user metadata with role and school info
      if (authData.user && (role || schoolId || isTemporaryPassword)) {
        const { error: updateError } = await this.client.auth.admin.updateUserById(authData.user.id, {
          app_metadata: {
            role: role ?? 'PARENT',
            school_id: schoolId,
            is_temporary_password: isTemporaryPassword ?? false,
          },
        });

        if (updateError) {
          return { success: false, error: updateError.message, code: updateError.code };
        }
      }

      return {
        success: true,
        data: {
          user: authData.user as AuthUser | null,
          session: authData.session,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  }

  // Sign in with email/password
  async signIn(data: SignInData): Promise<AuthResult<{ user: AuthUser; session: AuthSession }>> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      if (!authData.user || !authData.session) {
        return { success: false, error: 'Authentication failed', code: 'AUTH_FAILED' };
      }

      return {
        success: true,
        data: {
          user: authData.user as AuthUser,
          session: authData.session,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  }

  // Sign in with phone OTP
  async signInWithPhone(phone: string): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
    try {
      const { data, error } = await this.client.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return {
        success: true,
        data: {
          user: data.user as AuthUser | null,
          session: data.session,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Phone sign in failed' };
    }
  }

  // Verify phone OTP
  async verifyPhoneOtp(phone: string, token: string): Promise<AuthResult<{ user: AuthUser; session: AuthSession }>> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'OTP verification failed', code: 'OTP_FAILED' };
      }

      return {
        success: true,
        data: {
          user: data.user as AuthUser,
          session: data.session,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'OTP verification failed' };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(data: PasswordResetData): Promise<AuthResult<void>> {
    try {
      const { email, redirectTo } = data;

      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo ?? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return { success: true, data: undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Password reset email failed' };
    }
  }

  // Update password (after reset or change)
  async updatePassword(data: UpdatePasswordData): Promise<AuthResult<AuthUser>> {
    try {
      const { password } = data;

      const { data: authData, error } = await this.client.auth.updateUser({
        password,
        data: { is_temporary_password: false },
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      if (!authData.user) {
        return { success: false, error: 'Password update failed', code: 'UPDATE_FAILED' };
      }

      return { success: true, data: authData.user as AuthUser };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Password update failed' };
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<AuthResult<AuthUser>> {
    try {
      const { data: authData, error } = await this.client.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      if (!authData.user) {
        return { success: false, error: 'Profile update failed', code: 'UPDATE_FAILED' };
      }

      return { success: true, data: authData.user as AuthUser };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Profile update failed' };
    }
  }

  // Get current session
  async getSession(): Promise<AuthSession | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  // Get current user
  async getUser(): Promise<AuthUser | null> {
    const { data } = await this.client.auth.getUser();
    return data.user as AuthUser | null;
  }

  // Sign out
  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return { success: false, error: error.message, code: error.code };
      }
      return { success: true, data: undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign out failed' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  // Extract JWT claims for RLS
  getJWTClaims(session: AuthSession | null): JWTClaims | null {
    if (!session?.access_token) return null;

    try {
      // Decode JWT payload (base64url decode)
      const payload = session.access_token.split('.')[1];
      if (!payload) return null;
      
      const decoded = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

      return {
        sub: decoded.sub,
        role: decoded.app_metadata?.role ?? 'PARENT',
        school_id: decoded.app_metadata?.school_id,
        email: decoded.email,
        is_temporary_password: decoded.app_metadata?.is_temporary_password,
        email_verified: decoded.email_verified ?? false,
        phone_verified: decoded.phone_verified ?? false,
        aud: decoded.aud,
        exp: decoded.exp,
      };
    } catch {
      return null;
    }
  }

  // Check if user has temporary password
  hasTemporaryPassword(session: AuthSession | null): boolean {
    const claims = this.getJWTClaims(session);
    return claims?.is_temporary_password ?? false;
  }

  // Get active school ID from session
  getActiveSchoolId(session: AuthSession | null, headerSchoolId?: string): string | null {
    const claims = this.getJWTClaims(session);
    return headerSchoolId ?? claims?.school_id ?? null;
  }
}

// Singleton instance
export const authService = new AuthService();

// Helper to create server-side context for tRPC
export async function createAuthContext(accessToken?: string): Promise<{
  user: AuthUser | null;
  session: AuthSession | null;
  claims: JWTClaims | null;
}> {
  if (!accessToken) {
    return { user: null, session: null, claims: null };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return { user: null, session: null, claims: null };
    }

    const session = { access_token: accessToken, user: data.user } as AuthSession;

    return {
      user: data.user as AuthUser,
      session,
      claims: authService.getJWTClaims(session),
    };
  } catch {
    return { user: null, session: null, claims: null };
  }
}

// Admin-only user management (service role)
export const adminAuth = {
  // Create user with admin privileges
  async createUser(data: SignUpData): Promise<AuthResult<AuthUser>> {
    try {
      const { email, password, phone, fullName, role, schoolId, isTemporaryPassword } = data;

      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        phone,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
        app_metadata: {
          role: role ?? 'PARENT',
          school_id: schoolId,
          is_temporary_password: isTemporaryPassword ?? false,
        },
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return { success: true, data: authData.user as AuthUser };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Admin user creation failed' };
    }
  },

  // Update user by ID (admin)
  async updateUserById(
    userId: string,
    updates: {
      email?: string;
      password?: string;
      phone?: string;
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
    }
  ): Promise<AuthResult<AuthUser>> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return { success: true, data: data.user as AuthUser };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Admin user update failed' };
    }
  },

  // Delete user by ID (admin)
  async deleteUserById(userId: string): Promise<AuthResult<void>> {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return { success: true, data: undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Admin user deletion failed' };
    }
  },

  // List users (admin)
  async listUsers(page = 1, perPage = 50): Promise<AuthResult<{ users: AuthUser[]; total: number }>> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        return { success: false, error: error.message, code: error.code };
      }

      return {
        success: true,
        data: {
          users: data.users as AuthUser[],
          total: data.total,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Admin list users failed' };
    }
  },
};

// Export types for external use
export type { SupabaseClient, User, Session } from '@supabase/supabase-js';

