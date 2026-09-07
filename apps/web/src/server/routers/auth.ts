import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  signUpSchema,
  signInSchema,
  passwordResetSchema,
  updatePasswordSchema,
  phoneSignInSchema,
  phoneOtpSchema,
} from '@km/validators';
import { authService } from '@km/auth';

export const authRouter = router({
  // Sign up
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const result = await authService.signUp(input);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        });
      }
      return result.data;
    }),

  // Sign in with password
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }) => {
      const result = await authService.signIn(input);
      if (!result.success) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: result.error,
        });
      }
      return result.data;
    }),

  // Sign in with phone (send OTP)
  signInWithPhone: publicProcedure
    .input(phoneSignInSchema)
    .mutation(async ({ input }) => {
      const result = await authService.signInWithPhone(input.phone);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        });
      }
      return result.data;
    }),

  // Verify phone OTP
  verifyPhoneOtp: publicProcedure
    .input(phoneOtpSchema)
    .mutation(async ({ input }) => {
      const result = await authService.verifyPhoneOtp(input.phone, input.token);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        });
      }
      return result.data;
    }),

  // Request password reset
  requestPasswordReset: publicProcedure
    .input(passwordResetSchema)
    .mutation(async ({ input }) => {
      const result = await authService.sendPasswordResetEmail(input);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        });
      }
      return { message: 'Password reset email sent' };
    }),

  // Update password
  updatePassword: publicProcedure
    .input(updatePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to update password',
        });
      }

      const result = await authService.updatePassword(input);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
        });
      }
      return result.data;
    }),

  // Get current user session
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      return {
        user: ctx.user,
      };
    }),
});
