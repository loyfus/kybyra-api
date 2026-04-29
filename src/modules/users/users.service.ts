import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { UpdateMeInput } from './users.schemas';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  locale: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DELETION_GRACE_DAYS = 30;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });
  if (!user) throw AppError.notFound('Usuário não encontrado');
  return user;
}

export async function updateMe(userId: string, input: UpdateMeInput) {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: PUBLIC_USER_SELECT,
  });
}

export async function requestAccountDeletion(userId: string) {
  const existing = await prisma.accountDeletionRequest.findFirst({
    where: { userId, completedAt: null, cancelledAt: null },
  });
  if (existing) return existing;

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + DELETION_GRACE_DAYS);

  return prisma.accountDeletionRequest.create({
    data: { userId, scheduledFor },
  });
}

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      refreshTokens: {
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
          userAgent: true,
          ipAddress: true,
        },
      },
      deletionRequests: true,
    },
  });
  if (!user) throw AppError.notFound('Usuário não encontrado');

  // Strip secrets before exposing.
  const { passwordHash: _passwordHash, ...safe } = user;
  return {
    exportedAt: new Date().toISOString(),
    user: safe,
  };
}
