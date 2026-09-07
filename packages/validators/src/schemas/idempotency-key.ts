import { z } from 'zod';

export const idempotencyKeySchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
});

export type IdempotencyKey = z.infer<typeof idempotencyKeySchema>;
