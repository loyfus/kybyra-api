import type { RequestHandler, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

function noopMiddleware(): RequestHandler {
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export const apiRateLimiter =
  process.env.VERCEL === '1'
    ? noopMiddleware()
    : rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
        },
      });
