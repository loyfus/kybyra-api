import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { car: true },
  });
}

export async function addFavorite(userId: string, carId: string) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw AppError.notFound('Veículo não encontrado');

  return prisma.favorite.upsert({
    where: { userId_carId: { userId, carId } },
    create: { userId, carId },
    update: {},
    include: { car: true },
  });
}

export async function removeFavorite(userId: string, carId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, carId } });
}
