import { z } from 'zod';

export const addToGarageSchema = z.object({
  carId: z.string().min(1),
  nickname: z.string().min(1).max(60).nullable().optional(),
  purchasedAt: z.string().datetime().nullable().optional(),
  odometerKm: z.number().int().min(0).max(2_000_000).nullable().optional(),
  notes: z.string().max(2_000).nullable().optional(),
});

export const updateGarageSchema = z
  .object({
    nickname: z.string().min(1).max(60).nullable().optional(),
    purchasedAt: z.string().datetime().nullable().optional(),
    odometerKm: z.number().int().min(0).max(2_000_000).nullable().optional(),
    notes: z.string().max(2_000).nullable().optional(),
  })
  .strict();

export type AddToGarageInput = z.infer<typeof addToGarageSchema>;
export type UpdateGarageInput = z.infer<typeof updateGarageSchema>;
