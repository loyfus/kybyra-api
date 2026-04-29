import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

type HttpishError = { statusCode?: unknown; status?: unknown; type?: unknown; message?: unknown };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Errors thrown by body-parser, http-errors, etc. expose `statusCode`/`status`.
  // Respect it so we don't surface a 500 for client-side issues like malformed JSON.
  if (typeof err === 'object' && err) {
    const e = err as HttpishError;
    const status =
      typeof e.statusCode === 'number'
        ? e.statusCode
        : typeof e.status === 'number'
          ? e.status
          : null;
    if (status && status >= 400 && status < 500) {
      const code = typeof e.type === 'string' ? e.type.toUpperCase() : 'BAD_REQUEST';
      const message = typeof e.message === 'string' ? e.message : 'Bad request';
      res.status(status).json({ error: { code, message } });
      return;
    }
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' },
  });
};
