import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const systemAdminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'SYSTEM_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Chỉ tài khoản System Admin được phép truy cập',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
