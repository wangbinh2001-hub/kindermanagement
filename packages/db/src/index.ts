import { PrismaClient } from '@prisma/client';

// JWTClaims type — mirrors @km/auth JWTClaims but avoids circular dependency
export type JWTClaims = {
  sub: string;
  role: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  school_id?: string;
  email?: string;
  is_temporary_password?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  child_id?: string;
  childId?: string;
  aud?: string;
  exp?: number;
};

export type TenantContext = {
  activeSchoolId: string | null;
  userId: string;
  actorRole: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  supportSessionId?: string;
  claims?: JWTClaims;
};

// Fallback mappings for Vercel Postgres & Supabase integrations
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  } else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
}

const globalForPrisma = globalThis as unknown as {
  prismaBase: PrismaClient | undefined;
};

export const base = globalForPrisma.prismaBase ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaBase = base;
}

export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      return query(args);
    },
  },
});

// Set RLS context for current transaction
export async function setRLSContext(ctx: TenantContext): Promise<void> {
  const claims = ctx.claims ?? {
    sub: ctx.userId,
    role: ctx.actorRole,
    school_id: ctx.activeSchoolId ?? undefined,
  };

  // Ensure claims includes correct school_id if activeSchoolId is provided
  if (ctx.activeSchoolId) {
    claims.school_id = ctx.activeSchoolId;
  }

  const claimsJson = JSON.stringify(claims);

  // Set JWT claims for RLS policies
  await base.$executeRawUnsafe(
    `SELECT set_config('request.jwt.claims', $1, true)`,
    claimsJson,
  );
}

// Execute function with tenant context (RLS)
export async function withTenant<T>(
  ctx: TenantContext,
  fn: () => Promise<T>,
): Promise<T> {
  await setRLSContext(ctx);
  try {
    return await fn();
  } finally {
    // Clear context after execution
    await base.$executeRawUnsafe(
      `SELECT set_config('request.jwt.claims', '{}', true)`,
    );
  }
}

// Create tenant context from auth context
export function createTenantContext(user: {
  id: string;
  role: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  activeSchoolId: string | null;
  claims?: JWTClaims;
}): TenantContext {
  return {
    userId: user.id,
    actorRole: user.role,
    activeSchoolId: user.activeSchoolId,
    claims: user.claims,
  };
}

export { Prisma, PrismaClient } from '@prisma/client';
export * from '@prisma/client';

