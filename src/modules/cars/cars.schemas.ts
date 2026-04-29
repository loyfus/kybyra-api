import { z } from 'zod';

const sortBySchema = z.enum([
  'brand',
  'year',
  'rangeKmWltp',
  'batteryKwh',
  'priceBrl',
  'msrpUsd',
  'createdAt',
]);

const sortOrderSchema = z.enum(['asc', 'desc']);

export const listCarsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  brand: z.string().trim().min(1).max(100).optional(),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  bodyStyle: z.string().trim().min(1).max(50).optional(),
  isHybrid: z.coerce.boolean().optional(),
  isPhev: z.coerce.boolean().optional(),
  minRange: z.coerce.number().int().min(0).max(2000).optional(),
  maxRange: z.coerce.number().int().min(0).max(2000).optional(),
  minBattery: z.coerce.number().min(0).max(500).optional(),
  maxBattery: z.coerce.number().min(0).max(500).optional(),

  sortBy: sortBySchema.default('brand'),
  sortOrder: sortOrderSchema.default('asc'),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListCarsQuery = z.infer<typeof listCarsQuerySchema>;

export const carSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(150),
});

export type CarSlugParam = z.infer<typeof carSlugParamSchema>;
