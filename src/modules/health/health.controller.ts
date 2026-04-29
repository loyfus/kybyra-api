import type { RequestHandler } from 'express';
import { prisma } from '../../config/prisma';

export const healthCheck: RequestHandler = async (_req, res) => {
  const startedAt = Date.now();
  let db: 'up' | 'down' = 'up';
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch {
    db = 'down';
  }
  res.json({
    status: db === 'up' ? 'ok' : 'degraded',
    db,
    uptime: process.uptime(),
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
};
