import { createAuthContext } from '@km/auth';
import { headers } from 'next/headers';
import type { UserContext } from './context';

export async function getRequestUser(): Promise<UserContext | null> {
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const authContext = await createAuthContext(token);
  if (!authContext.user || !authContext.claims) return null;

  const selectedSchoolId = requestHeaders.get('x-school-id');
  const activeSchoolId =
    selectedSchoolId ??
    (authContext.claims.role === 'SYSTEM_ADMIN' ? null : authContext.claims.school_id ?? null);

  return {
    id: authContext.user.id,
    role: authContext.claims.role,
    email: authContext.user.email,
    activeSchoolId,
    claims: authContext.claims,
  };
}
