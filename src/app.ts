import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { Sentry } from './config/sentry';
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import healthRouter from './modules/health/health.routes';
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';

export function buildApp(): express.Express {
  const app = express();

  // Security
  app.use(helmet());

  const origins = env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: origins.length === 0 ? true : origins,
      credentials: true,
    }),
  );

  // Logging (request-scoped)
  app.use(pinoHttp({ logger }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health (outside /api so rate limiter doesn't apply)
  app.use('/health', healthRouter);

  // Rate limit (api scope only)
  app.use('/api', apiRateLimiter);

  // API v1
  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/me', usersRouter);
  app.use('/api/v1', v1);

  // 404
  app.use(notFound);

  // Sentry must be installed before the user-defined error handler.
  if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // Error handler
  app.use(errorHandler);

  return app;
}
