import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { AddToGarageInput, UpdateGarageInput } from './garage.schemas';

export async function listGarage(userId: string) {
  return prisma.userCar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { car: true },
  });
}

export async function addToGarage(userId: string, input: AddToGarageInput) {
  const car = await prisma.car.findUnique({ where: { id: input.carId } });
  if (!car) throw AppError.notFound('Veículo não encontrado');

  try {
    return await prisma.userCar.create({
      data: {
        userId,
        carId: input.carId,
        nickname: input.nickname ?? null,
        purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
        odometerKm: input.odometerKm ?? null,
        notes: input.notes ?? null,
      },
      include: { car: true },
    });
  } catch (err) {
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      throw AppError.conflict('Veículo já está na sua garagem');
    }
    throw err;
  }
}

export async function updateGarageEntry(
  userId: string,
  id: string,
  input: UpdateGarageInput,
) {
  const entry = await prisma.userCar.findFirst({ where: { id, userId } });
  if (!entry) throw AppError.notFound('Item da garagem não encontrado');

  return prisma.userCar.update({
    where: { id },
    data: {
      nickname: input.nickname,
      purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : input.purchasedAt,
      odometerKm: input.odometerKm,
      notes: input.notes,
    },
    include: { car: true },
  });
}

export async function removeFromGarage(userId: string, id: string): Promise<void> {
  const entry = await prisma.userCar.findFirst({ where: { id, userId } });
  if (!entry) throw AppError.notFound('Item da garagem não encontrado');
  await prisma.userCar.delete({ where: { id } });
}
