import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { parseDuration } from '../../utils/duration';
import { hashPassword, verifyPassword } from './hash';
import {
  generateJti,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './tokens';
import type { LoginInput, RegisterInput } from './auth.schemas';

type SessionMeta = {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

const refreshTtlMs = parseDuration(env.JWT_REFRESH_TTL);

export async function register(input: RegisterInput, meta: SessionMeta): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('Email já cadastrado');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
    select: { id: true, email: true, name: true },
  });
  return issueTokens(user, meta);
}

export async function login(input: LoginInput, meta: SessionMeta): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt) {
    throw AppError.unauthorized('Credenciais inválidas');
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Credenciais inválidas');
  }
  return issueTokens({ id: user.id, email: user.email, name: user.name }, meta);
}

export async function refresh(token: string, meta: SessionMeta): Promise<AuthResponse> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized('Refresh token inválido');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.tokenHash !== hashRefreshToken(token)) {
    throw AppError.unauthorized('Refresh token não reconhecido');
  }
  if (stored.revokedAt) {
    // Token reuse detected: revoke ALL active tokens for this user (defense in depth).
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthorized('Refresh token reutilizado; sessão encerrada por segurança');
  }
  if (stored.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token expirado');
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, email: true, name: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    throw AppError.unauthorized('Usuário não encontrado');
  }

  const newJti = generateJti();
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, jti: newJti });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedByTokenId: newJti },
    }),
    prisma.refreshToken.create({
      data: {
        id: newJti,
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    }),
  ]);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
  };
}

export async function logout(token: string): Promise<void> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return; // idempotente
  }
  await prisma.refreshToken.updateMany({
    where: { id: payload.jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(user: PublicUser, meta: SessionMeta): Promise<AuthResponse> {
  const jti = generateJti();
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt: new Date(Date.now() + refreshTtlMs),
    },
  });

  return { user, accessToken, refreshToken };
}
