import path from 'node:path';
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
import carsRouter from './modules/cars/cars.routes';
import garageRouter from './modules/garage/garage.routes';
import favoritesRouter from './modules/favorites/favorites.routes';
import vinRouter from './modules/vin/vin.routes';

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

  // Static uploads (car images, etc.) — outside /api, no rate limit, with cache headers.
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      maxAge: '7d',
      immutable: false,
      fallthrough: false,
    }),
  );

  // Rate limit (api scope only)
  app.use('/api', apiRateLimiter);

  // API v1
  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/cars', carsRouter);
  v1.use('/vin', vinRouter);
  v1.use('/me/garage', garageRouter);
  v1.use('/me/favorites', favoritesRouter);
  v1.use('/me', usersRouter); // Mount LAST so /me/garage and /me/favorites are matched first.
  app.use('/api/v1', v1);

  // Root endpoint — avoids confusing 404 when visiting the base URL
  app.get('/', (_req, res) => {
    res.json({
      name: 'Kybyra API',
      version: '1.0.0',
      health: '/api/v1/health',
      docs: '/api/v1/health',
    });
  });

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
