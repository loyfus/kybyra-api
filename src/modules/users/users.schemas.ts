import { z } from 'zod';

export const updateMeSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    locale: z.string().min(2).max(10).optional(),
    theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']).optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .strict();

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
