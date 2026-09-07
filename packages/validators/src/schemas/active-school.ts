import { z } from 'zod';

export const activeSchoolContextSchema = z.object({
  activeSchoolId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  actorRole: z.enum(['SYSTEM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'PARENT']),
  supportSessionId: z.string().uuid().optional(),
});

export type ActiveSchoolContext = z.infer<typeof activeSchoolContextSchema>;
