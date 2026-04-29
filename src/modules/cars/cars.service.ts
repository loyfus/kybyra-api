import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { ListCarsQuery } from './cars.schemas';

export type ListCarsResult = {
  items: Awaited<ReturnType<typeof listCars>>['items'];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listCars(query: ListCarsQuery) {
  const where: Prisma.CarWhereInput = {};

  if (query.q) {
    where.OR = [
      { brand: { contains: query.q, mode: 'insensitive' } },
      { model: { contains: query.q, mode: 'insensitive' } },
      { variant: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.brand) where.brand = { equals: query.brand, mode: 'insensitive' };
  if (query.year) where.year = query.year;
  if (query.bodyStyle) where.bodyStyle = { equals: query.bodyStyle, mode: 'insensitive' };
  if (query.isHybrid !== undefined) where.isHybrid = query.isHybrid;
  if (query.isPhev !== undefined) where.isPhev = query.isPhev;

  if (query.minRange !== undefined || query.maxRange !== undefined) {
    where.rangeKmWltp = {
      gte: query.minRange,
      lte: query.maxRange,
    };
  }
  if (query.minBattery !== undefined || query.maxBattery !== undefined) {
    where.batteryKwh = {
      gte: query.minBattery,
      lte: query.maxBattery,
    };
  }

  const orderBy: Prisma.CarOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
    }),
    prisma.car.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize) || 1,
  };
}

export async function getCarBySlug(slug: string) {
  const car = await prisma.car.findUnique({ where: { slug } });
  if (!car) throw AppError.notFound('Veículo não encontrado');
  return car;
}

export async function listBrands(): Promise<Array<{ brand: string; count: number }>> {
  const rows = await prisma.car.groupBy({
    by: ['brand'],
    _count: { brand: true },
    orderBy: { brand: 'asc' },
  });
  return rows.map((r) => ({ brand: r.brand, count: r._count.brand }));
}
