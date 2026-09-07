import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@km/db';
import { createAuthContext } from '@km/auth';
import type { JWTClaims } from '@km/db';

export type UserContext = {
  id: string;
  role: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT';
  email?: string;
  activeSchoolId: string | null;
  claims?: JWTClaims;
};

export type Context = {
  prisma: typeof prisma;
  user: UserContext | null;
};

export async function createContext(_opts: FetchCreateContextFnOptions): Promise<Context> {
  const authHeader = _opts.req.headers.get('authorization');
  const schoolIdHeader = _opts.req.headers.get('x-school-id');

  if (!authHeader) {
    return { prisma, user: null };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const authContext = await createAuthContext(token);

  if (!authContext.user || !authContext.claims) {
    return { prisma, user: null };
  }

  // SYSTEM_ADMIN has no default school context; x-school-id header override support sessions
  let activeSchoolId: string | null = null;
  if (authContext.claims.role !== 'SYSTEM_ADMIN') {
    activeSchoolId = authContext.claims.school_id ?? null;
  }
  // System admin can act on behalf of a school via x-school-id header (e.g., support session)
  if (schoolIdHeader && authContext.claims.role === 'SYSTEM_ADMIN') {
    activeSchoolId = schoolIdHeader;
  }

  return {
    prisma,
    user: {
      id: authContext.user.id,
      role: authContext.claims.role,
      email: authContext.user.email,
      activeSchoolId,
      claims: authContext.claims,
    },
  };
}
