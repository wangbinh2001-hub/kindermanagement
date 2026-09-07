import { z } from 'zod';

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

export const phoneSignInSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
});

export const phoneOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  token: z.string().length(6, 'OTP must be 6 digits'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PhoneSignInInput = z.infer<typeof phoneSignInSchema>;
export type PhoneOtpInput = z.infer<typeof phoneOtpSchema>;
